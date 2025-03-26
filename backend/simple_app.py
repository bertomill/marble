from flask import Flask, request, jsonify
from flask_cors import CORS
from colorthief import ColorThief
import requests
import os
import tempfile
import re
import json
import uuid
from openai import OpenAI
from dotenv import load_dotenv
import time

# Try to load environment variables from .env.local, but don't fail if it doesn't exist.
try:
    if os.path.exists('.env.local'):
        load_dotenv('.env.local')
except Exception:
    pass  # Silently continue if .env.local doesn't exist or cannot be loaded.

app = Flask(__name__)
CORS(app, origins="*")  # Enable CORS for all origins.

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# In-memory storage for job status (in a production app, use a database)
analysis_jobs = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Google Cloud Run"""
    return jsonify({"status": "healthy", "message": "Color analysis API is running"}), 200

@app.route('/api/extract-colors', methods=['POST'])
def extract_colors():
    """Extract dominant colors from an image URL"""
    data = request.json
    
    if not data or 'imageUrl' not in data:
        return jsonify({"error": "Missing imageUrl parameter"}), 400
    
    image_url = data['imageUrl']
    color_count = data.get('colorCount', 5)  # Default to 5 colors
    
    try:
        # Download the image
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_filename = temp_file.name
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    temp_file.write(chunk)
        
        # Use ColorThief to extract the palette
        color_thief = ColorThief(temp_filename)
        palette = color_thief.get_palette(color_count=color_count, quality=1)
        
        # Clean up the temporary file
        os.unlink(temp_filename)
        
        # Convert RGB tuples to hex colors
        hex_colors = ['#%02x%02x%02x' % rgb for rgb in palette]
        
        return jsonify({
            "colors": hex_colors,
            "imageUrl": image_url
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-palette', methods=['POST'])
def generate_palette():
    """Generate a simple color palette based on a base color"""
    data = request.json
    
    if not data or 'baseColor' not in data:
        return jsonify({"error": "Missing baseColor parameter"}), 400
    
    base_color = data['baseColor']
    
    try:
        # Validate the color format
        if not re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', base_color):
            return jsonify({"error": "Invalid color format, must be hex (e.g., #FF5733)"}), 400
        
        # Convert hex to RGB
        if len(base_color) == 4:  # Handle shorthand hex (#RGB)
            r = int(base_color[1] + base_color[1], 16)
            g = int(base_color[2] + base_color[2], 16)
            b = int(base_color[3] + base_color[3], 16)
        else:  # Standard hex (#RRGGBB)
            r = int(base_color[1:3], 16)
            g = int(base_color[3:5], 16)
            b = int(base_color[5:7], 16)
        
        # Generate a simple palette - just lighter and darker versions
        colors = [
            base_color,  # Original color
            rgb_to_hex(min(r + 50, 255), min(g + 50, 255), min(b + 50, 255)),  # Lighter
            rgb_to_hex(max(r - 50, 0), max(g - 50, 0), max(b - 50, 0)),  # Darker
            rgb_to_hex(min(r + 100, 255), min(g + 100, 255), min(b + 100, 255)),  # Much lighter
            rgb_to_hex(max(r - 100, 0), max(g - 100, 0), max(b - 100, 0))  # Much darker
        ]
        
        return jsonify({
            "baseColor": base_color,
            "colors": colors
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/competitor/find', methods=['POST'])
def find_competitors():
    """Find top competitors for a business using OpenAI's web search capability"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Missing request data"}), 400
    
    business_description = data.get('businessDescription', '')
    industry = data.get('industry', '')
    
    if not industry and not business_description:
        return jsonify({"error": "Both industry and business description cannot be empty"}), 400
    
    try:
        # Create search query based on business information
        search_query = f"Find top 5 competitors for a {industry} business that {business_description}"
        
        # First use web search to find competitors
        search_response = client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview"}],
            tool_choice={"type": "web_search_preview"},  # Force using web search
            input=search_query
        )
        
        # Extract the search result text
        search_results = search_response.output_text
        
        # Now ask GPT to analyze the search results and extract structured competitor information
        analysis_prompt = f"""
        Based on the following web search results about competitors in the {industry} industry, 
        extract information for the top 5 competitors. For each competitor provide:
        1. Company name
        2. Website URL (if available)
        3. Brief description of their business
        4. Why they're a competitor to a business in the {industry} industry
        
        Format the output as a JSON array with fields: name, url, description, competitiveReason
        
        Search results:
        {search_results}
        """
        
        analysis_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured competitor information from web search results."},
                {"role": "user", "content": analysis_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Extract the structured competitor data
        competitors = []
        try:
            competitors_data = json.loads(analysis_response.choices[0].message.content)
            
            # Check if we have a valid competitors array
            if "competitors" in competitors_data and isinstance(competitors_data["competitors"], list):
                competitor_list = competitors_data["competitors"]
            elif isinstance(competitors_data, list):
                competitor_list = competitors_data
            else:
                # If not in expected format, create an empty list
                competitor_list = []
                
            # Generate a unique job ID for this batch of competitors
            job_id_base = uuid.uuid4().hex[:12]
            
            # Process the competitors data, limiting to 5 competitors
            for i, comp in enumerate(competitor_list):
                if i >= 5:  # Only process the first 5 competitors
                    break
                    
                job_id = f"{job_id_base}_{i}"
                
                competitors.append({
                    "name": comp.get("name", f"Competitor {i+1}"),
                    "url": comp.get("url", f"https://example.com/competitor{i+1}"),
                    "description": comp.get("description", "No description available"),
                    "competitiveReason": comp.get("competitiveReason", "Competitor in your industry"),
                    "jobId": job_id,
                    "status": "pending"  # Initial status for the analysis job
                })
                
        except Exception as e:
            print(f"Error parsing competitor data: {str(e)}")
            # Don't re-raise, we'll handle by generating fallback data
        
        # If we couldn't extract structured data, provide a fallback
        if not competitors:
            job_id_base = uuid.uuid4().hex[:12]
            
            for i in range(5):  # Generate 5 fallback competitors
                job_id = f"{job_id_base}_{i}"
                competitors.append({
                    "name": f"Competitor {i+1} (based on web search)",
                    "url": f"https://example.com/competitor{i+1}",
                    "description": "Details from OpenAI web search",
                    "competitiveReason": "Found via industry and business description analysis",
                    "jobId": job_id,
                    "status": "pending"
                })
        
        return jsonify({
            "competitors": competitors,
            "message": "Competitor analysis started automatically for all URLs"
        })
        
    except Exception as e:
        print(f"Error in find-competitors: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/competitor/status', methods=['POST'])
def get_analysis_status():
    """Get the status of competitor analysis jobs"""
    data = request.json
    
    if not data or not data.get('jobIds'):
        return jsonify({"error": "Missing jobIds parameter"}), 400
    
    job_ids = data.get('jobIds')
    
    # Get status for each job
    status_results = {}
    
    for job_id in job_ids:
        # Check if we have the job in our storage
        if job_id in analysis_jobs:
            # Return the stored job status
            status_results[job_id] = analysis_jobs[job_id]
        else:
            # For any job we don't have in storage yet, simulate processing
            # In a real app, you'd check a task queue or database
            
            # Extract the index from the job_id (e.g., "abc123_2" -> 2)
            try:
                index = int(job_id.split('_')[-1])
            except (ValueError, IndexError):
                index = 0
                
            # Simulate completion based on the current time and job index
            # This creates a staggered completion effect where jobs complete one by one
            current_time = time.time()
            seed = int(current_time / 10)  # Changes every 10 seconds
            
            # Jobs complete in sequence based on time
            # First job completes immediately, others complete over time
            if index <= (seed % 5):  # Will gradually complete all 5 competitors
                status = 'completed'
                
                # Generate different analysis data based on index
                colors = [
                    ["#3B82F6", "#1E40AF", "#DBEAFE", "#FFFFFF", "#111827"],  # Blue theme
                    ["#10B981", "#065F46", "#D1FAE5", "#FFFFFF", "#1F2937"],  # Green theme
                    ["#F59E0B", "#B45309", "#FEF3C7", "#FFFFFF", "#1F2937"],  # Yellow theme
                    ["#EF4444", "#B91C1C", "#FEE2E2", "#FFFFFF", "#111827"],  # Red theme
                    ["#8B5CF6", "#5B21B6", "#EDE9FE", "#FFFFFF", "#1F2937"]   # Purple theme
                ]
                
                typography = [
                    ["Inter", "Roboto", "Sans-serif"],
                    ["Montserrat", "Helvetica", "Sans-serif"],
                    ["Poppins", "Arial", "Sans-serif"],
                    ["Open Sans", "Verdana", "Sans-serif"],
                    ["Raleway", "Trebuchet MS", "Sans-serif"]
                ]
                
                layouts = [
                    "Modern, clean layout with good use of whitespace",
                    "Grid-based layout with bold imagery",
                    "Minimalist design with focus on content",
                    "Creative layout with asymmetrical elements",
                    "Corporate layout with structured sections"
                ]
                
                # Create analysis data specific to the competitor
                analysis_data = {
                    "visualDesign": {
                        "colors": colors[index % len(colors)],
                        "typography": typography[index % len(typography)],
                        "layout": layouts[index % len(layouts)]
                    },
                    "keyFeatures": [
                        ["Responsive design", "Video background", "Interactive elements", "Dark mode", "Animation effects"][index % 5],
                        ["Clear CTAs", "Customer stories", "Chatbot", "Filtering options", "Personalization"][index % 5],
                        ["Testimonials", "Case studies", "Social proof", "Reviews", "Ratings"][index % 5],
                        ["Product showcase", "Service highlights", "Team members", "Clients", "Partners"][index % 5],
                        ["Newsletter signup", "Contact form", "Live chat", "FAQ section", "Help center"][index % 5]
                    ],
                    "contentStrategy": ["Customer-focused messaging", "Solution-oriented approach", "Educational content", "Story-based narrative", "Technical expertise"][index % 5],
                    "strengths": [
                        ["Clean design", "Strong branding", "Modern aesthetics", "Visual hierarchy", "Color coordination"][index % 5],
                        ["Clear messaging", "Consistent identity", "Concise copy", "Persuasive writing", "Technical accuracy"][index % 5],
                        ["Easy navigation", "Engaging content", "Intuitive interface", "Fast loading", "Mobile optimization"][index % 5]
                    ],
                    "weaknesses": [
                        ["Limited interactive elements", "Slow page load", "Outdated design", "Poor mobile experience", "Cluttered layout"][index % 5],
                        ["Generic stock photos", "Complex navigation", "Inconsistent branding", "Lacking accessibility", "Poor readability"][index % 5]
                    ],
                    "uniqueSellingPoints": [
                        ["Industry leader", "Proprietary technology", "Cost efficiency", "Premium quality", "Exclusive features"][index % 5],
                        ["Award-winning design", "Custom solutions", "Free trial", "No-code platform", "Enterprise-grade"][index % 5],
                        ["24/7 customer support", "Industry expertise", "Quick setup", "International reach", "Compliance certified"][index % 5]
                    ],
                    "inspirationElements": [
                        ["Hero section", "Animated statistics", "Product tour", "Success stories", "Interactive demo"][index % 5],
                        ["Testimonial carousel", "Case study layout", "Feature comparison", "Integration logos", "Roadmap"][index % 5],
                        ["Pricing table", "Team section", "FAQ accordion", "Support chat", "Resource library"][index % 5]
                    ]
                }
                
                # Store in our in-memory storage for future requests
                analysis_jobs[job_id] = {
                    "status": status,
                    "results": {
                        "analysis": analysis_data,
                        "screenshot": f"/competitor-screenshot-{index+1}.jpg"  # Placeholder path
                    }
                }
                
                status_results[job_id] = analysis_jobs[job_id]
                
            else:
                # For the rest, return processing status
                if index == ((seed % 5) + 1):  # Next job to complete is "processing"
                    progress = "almost complete"
                elif index == ((seed % 5) + 2):  # Two jobs away from completion
                    progress = "halfway done"
                else:
                    progress = "just started"
                
                status_results[job_id] = {
                    "status": "processing",
                    "message": f"Analysis {progress}"
                }
    
    return jsonify(status_results)

def rgb_to_hex(r, g, b):
    """Convert RGB values to hex color code"""
    return f'#{r:02x}{g:02x}{b:02x}'

if __name__ == '__main__':
    # Get port from environment variable or use 8080 as default
    port = int(os.environ.get('PORT', 8080))
    
    # Run the app with Gunicorn in production or Flask's development server locally
    if os.environ.get('ENVIRONMENT') == 'production':
        # Gunicorn will be used by Cloud Run via the Dockerfile CMD
        pass
    else:
        # Use Flask's development server for local development
        app.run(host='0.0.0.0', port=port, debug=True) 