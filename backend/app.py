from flask import Flask, request, jsonify
from flask_cors import CORS
from colorthief import ColorThief
from PIL import Image
import requests
import io
import os
import tempfile
import numpy as np
import extcolors
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse, urljoin
import json
from openai import OpenAI
import time
import uuid
from dotenv import load_dotenv
import traceback

# Load environment variables from .env.local
load_dotenv('.env.local')

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage for analysis jobs (would use a database in production)
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

@app.route('/api/extract-from-website', methods=['POST'])
def extract_from_website():
    """Extract colors, fonts, and design elements from a website URL"""
    data = request.json
    
    if not data or 'url' not in data:
        return jsonify({"error": "Missing url parameter"}), 400
    
    url = data['url']
    
    try:
        # Validate and normalize URL
        parsed = urlparse(url)
        if not parsed.scheme:
            url = 'https://' + url
        
        # Fetch the website content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract colors from CSS
        css_colors = extract_css_colors(soup, response.text)
        
        # Extract fonts
        fonts = extract_fonts(soup)
        
        # Extract technologies (basic detection)
        technologies = detect_technologies(soup)
        
        return jsonify({
            "url": url,
            "colors": css_colors[:10],  # Limit to top 10 colors
            "fonts": fonts[:5],  # Limit to top 5 fonts
            "technologies": technologies
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_css_colors(soup, html_content):
    """Extract color values from CSS and inline styles"""
    # Regular expression to match color values in CSS
    color_pattern = r'#(?:[0-9a-fA-F]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)'
    
    # Find all color values in the HTML content
    all_colors = re.findall(color_pattern, html_content)
    
    # Process and normalize colors
    processed_colors = []
    color_frequency = {}
    
    for color in all_colors:
        color = color.lower()
        if color in color_frequency:
            color_frequency[color] += 1
        else:
            color_frequency[color] = 1
    
    # Sort colors by frequency
    sorted_colors = sorted(color_frequency.items(), key=lambda x: x[1], reverse=True)
    processed_colors = [color for color, _ in sorted_colors]
    
    # Filter out common background colors like white, black, and grays if we have enough colors
    filtered_colors = []
    common_colors = ['#fff', '#ffffff', '#000', '#000000', '#f0f0f0', '#f5f5f5', '#f8f8f8', '#fafafa']
    
    for color in processed_colors:
        if len(filtered_colors) >= 15:  # Collect up to 15 colors
            break
        if color not in common_colors or len(processed_colors) < 5:
            filtered_colors.append(color)
    
    return filtered_colors

def extract_fonts(soup):
    """Extract font families used in the website"""
    fonts = set()
    
    # Look for font-family in style attributes
    for tag in soup.find_all(style=True):
        style = tag['style'].lower()
        if 'font-family' in style:
            font_family = re.search(r'font-family\s*:\s*([^;]+)', style)
            if font_family:
                # Split and clean font names
                for font in font_family.group(1).split(','):
                    font = font.strip().strip("'").strip('"')
                    if font and not font.startswith('data:'):
                        fonts.add(font)
    
    # Look for Google Fonts
    for link in soup.find_all('link', href=True):
        href = link['href']
        if 'fonts.googleapis.com' in href:
            # Extract font names from Google Fonts URL
            family_param = re.search(r'family=([^&]+)', href)
            if family_param:
                for family in family_param.group(1).split('|'):
                    family = family.split(':')[0].replace('+', ' ')
                    fonts.add(family)
    
    return list(fonts)

def detect_technologies(soup):
    """Basic detection of technologies used in the website"""
    technologies = []
    
    # Check for common technologies
    if soup.find('meta', attrs={'name': 'generator', 'content': re.compile(r'WordPress', re.I)}):
        technologies.append('WordPress')
    
    if soup.find('script', src=re.compile(r'react', re.I)):
        technologies.append('React')
    
    if soup.find('script', src=re.compile(r'vue', re.I)):
        technologies.append('Vue.js')
    
    if soup.find('script', src=re.compile(r'angular', re.I)):
        technologies.append('Angular')
    
    if soup.find('script', src=re.compile(r'bootstrap', re.I)) or soup.find('link', href=re.compile(r'bootstrap', re.I)):
        technologies.append('Bootstrap')
    
    if soup.find('script', src=re.compile(r'jquery', re.I)):
        technologies.append('jQuery')
    
    if soup.find('script', src=re.compile(r'tailwind', re.I)) or 'tailwind' in str(soup).lower():
        technologies.append('Tailwind CSS')
    
    if soup.find('script', src=re.compile(r'gsap', re.I)) or soup.find('script', text=re.compile(r'TweenMax', re.I)):
        technologies.append('GSAP (Animation)')
    
    if soup.find('script', src=re.compile(r'three\.js', re.I)):
        technologies.append('Three.js (3D)')
    
    # Check for meta tags
    for meta in soup.find_all('meta'):
        if meta.get('name') == 'generator' and meta.get('content'):
            technologies.append(f"Generator: {meta['content'].split()[0]}")
    
    return technologies

@app.route('/api/generate-palette', methods=['POST'])
def generate_palette():
    """Generate a color palette based on a base color"""
    data = request.json
    
    if not data or 'baseColor' not in data:
        return jsonify({"error": "Missing baseColor parameter"}), 400
    
    base_color = data['baseColor']
    palette_type = data.get('type', 'analogous')  # Default to analogous
    
    try:
        # Validate the color format
        if not re.match(r'^#(?:[0-9a-fA-F]{3}){1,2}$', base_color):
            return jsonify({"error": "Invalid color format, must be hex (e.g., #FF5733)"}), 400
        
        # Convert hex to RGB
        r = int(base_color[1:3], 16)
        g = int(base_color[3:5], 16)
        b = int(base_color[5:7], 16)
        
        # Generate palette based on type
        colors = []
        if palette_type == 'analogous':
            colors = generate_analogous(r, g, b)
        elif palette_type == 'complementary':
            colors = generate_complementary(r, g, b)
        elif palette_type == 'triadic':
            colors = generate_triadic(r, g, b)
        elif palette_type == 'monochromatic':
            colors = generate_monochromatic(r, g, b)
        else:
            return jsonify({"error": "Invalid palette type"}), 400
        
        return jsonify({
            "baseColor": base_color,
            "type": palette_type,
            "colors": colors
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def rgb_to_hex(r, g, b):
    """Convert RGB values to hex color code"""
    return f'#{r:02x}{g:02x}{b:02x}'

def generate_analogous(r, g, b):
    """Generate analogous color palette"""
    # Convert RGB to HSV
    r, g, b = r/255.0, g/255.0, b/255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    
    v = max_val
    
    if max_val == 0:
        s = 0
    else:
        s = (max_val - min_val) / max_val
    
    if max_val == min_val:
        h = 0
    elif max_val == r:
        h = (60 * ((g - b) / (max_val - min_val)) + 360) % 360
    elif max_val == g:
        h = (60 * ((b - r) / (max_val - min_val)) + 120) % 360
    else:
        h = (60 * ((r - g) / (max_val - min_val)) + 240) % 360
    
    # Create analogous colors (color wheel neighbors)
    colors = []
    
    # Original color
    colors.append(rgb_to_hex(int(r*255), int(g*255), int(b*255)))
    
    # -30 degrees
    h1 = (h - 30) % 360
    c = v * s
    x = c * (1 - abs((h1 / 60) % 2 - 1))
    m = v - c
    
    if 0 <= h1 < 60:
        r1, g1, b1 = c, x, 0
    elif 60 <= h1 < 120:
        r1, g1, b1 = x, c, 0
    elif 120 <= h1 < 180:
        r1, g1, b1 = 0, c, x
    elif 180 <= h1 < 240:
        r1, g1, b1 = 0, x, c
    elif 240 <= h1 < 300:
        r1, g1, b1 = x, 0, c
    else:
        r1, g1, b1 = c, 0, x
    
    colors.append(rgb_to_hex(int((r1 + m)*255), int((g1 + m)*255), int((b1 + m)*255)))
    
    # +30 degrees
    h2 = (h + 30) % 360
    
    if 0 <= h2 < 60:
        r2, g2, b2 = c, x, 0
    elif 60 <= h2 < 120:
        r2, g2, b2 = x, c, 0
    elif 120 <= h2 < 180:
        r2, g2, b2 = 0, c, x
    elif 180 <= h2 < 240:
        r2, g2, b2 = 0, x, c
    elif 240 <= h2 < 300:
        r2, g2, b2 = x, 0, c
    else:
        r2, g2, b2 = c, 0, x
    
    colors.append(rgb_to_hex(int((r2 + m)*255), int((g2 + m)*255), int((b2 + m)*255)))
    
    # Add light and dark versions of original
    light = min(1.0, v * 1.3)
    dark = max(0.0, v * 0.7)
    
    colors.append(rgb_to_hex(int(r*255*0.95), int(g*255*0.95), int(b*255*0.95)))
    colors.append(rgb_to_hex(int(r*255*0.6), int(g*255*0.6), int(b*255*0.6)))
    
    return colors

def generate_complementary(r, g, b):
    """Generate complementary color palette"""
    # Convert RGB to HSV (simplified implementation)
    r, g, b = r/255.0, g/255.0, b/255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    
    v = max_val
    
    if max_val == 0:
        s = 0
    else:
        s = (max_val - min_val) / max_val
    
    if max_val == min_val:
        h = 0
    elif max_val == r:
        h = (60 * ((g - b) / (max_val - min_val)) + 360) % 360
    elif max_val == g:
        h = (60 * ((b - r) / (max_val - min_val)) + 120) % 360
    else:
        h = (60 * ((r - g) / (max_val - min_val)) + 240) % 360
    
    # Create complementary colors
    colors = []
    
    # Original color
    colors.append(rgb_to_hex(int(r*255), int(g*255), int(b*255)))
    
    # Complementary color (opposite on color wheel, +180 degrees)
    h_comp = (h + 180) % 360
    
    c = v * s
    x = c * (1 - abs((h_comp / 60) % 2 - 1))
    m = v - c
    
    if 0 <= h_comp < 60:
        r_comp, g_comp, b_comp = c, x, 0
    elif 60 <= h_comp < 120:
        r_comp, g_comp, b_comp = x, c, 0
    elif 120 <= h_comp < 180:
        r_comp, g_comp, b_comp = 0, c, x
    elif 180 <= h_comp < 240:
        r_comp, g_comp, b_comp = 0, x, c
    elif 240 <= h_comp < 300:
        r_comp, g_comp, b_comp = x, 0, c
    else:
        r_comp, g_comp, b_comp = c, 0, x
    
    r_comp, g_comp, b_comp = r_comp + m, g_comp + m, b_comp + m
    colors.append(rgb_to_hex(int(r_comp*255), int(g_comp*255), int(b_comp*255)))
    
    # Add variants (lighter and darker) of both colors
    colors.append(rgb_to_hex(int(min(r*255*1.3, 255)), int(min(g*255*1.3, 255)), int(min(b*255*1.3, 255))))
    colors.append(rgb_to_hex(int(r*255*0.7), int(g*255*0.7), int(b*255*0.7)))
    colors.append(rgb_to_hex(int(min(r_comp*255*1.3, 255)), int(min(g_comp*255*1.3, 255)), int(min(b_comp*255*1.3, 255))))
    
    return colors

def generate_triadic(r, g, b):
    """Generate triadic color palette"""
    # Convert RGB to HSV
    r, g, b = r/255.0, g/255.0, b/255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    
    v = max_val
    
    if max_val == 0:
        s = 0
    else:
        s = (max_val - min_val) / max_val
    
    if max_val == min_val:
        h = 0
    elif max_val == r:
        h = (60 * ((g - b) / (max_val - min_val)) + 360) % 360
    elif max_val == g:
        h = (60 * ((b - r) / (max_val - min_val)) + 120) % 360
    else:
        h = (60 * ((r - g) / (max_val - min_val)) + 240) % 360
    
    # Create triadic colors (120° apart on color wheel)
    colors = []
    
    # Original color
    colors.append(rgb_to_hex(int(r*255), int(g*255), int(b*255)))
    
    # +120 degrees
    h1 = (h + 120) % 360
    c = v * s
    x = c * (1 - abs((h1 / 60) % 2 - 1))
    m = v - c
    
    if 0 <= h1 < 60:
        r1, g1, b1 = c, x, 0
    elif 60 <= h1 < 120:
        r1, g1, b1 = x, c, 0
    elif 120 <= h1 < 180:
        r1, g1, b1 = 0, c, x
    elif 180 <= h1 < 240:
        r1, g1, b1 = 0, x, c
    elif 240 <= h1 < 300:
        r1, g1, b1 = x, 0, c
    else:
        r1, g1, b1 = c, 0, x
    
    colors.append(rgb_to_hex(int((r1 + m)*255), int((g1 + m)*255), int((b1 + m)*255)))
    
    # +240 degrees
    h2 = (h + 240) % 360
    
    if 0 <= h2 < 60:
        r2, g2, b2 = c, x, 0
    elif 60 <= h2 < 120:
        r2, g2, b2 = x, c, 0
    elif 120 <= h2 < 180:
        r2, g2, b2 = 0, c, x
    elif 180 <= h2 < 240:
        r2, g2, b2 = 0, x, c
    elif 240 <= h2 < 300:
        r2, g2, b2 = x, 0, c
    else:
        r2, g2, b2 = c, 0, x
    
    colors.append(rgb_to_hex(int((r2 + m)*255), int((g2 + m)*255), int((b2 + m)*255)))
    
    # Add neutral colors
    colors.append('#FFFFFF')
    colors.append('#333333')
    
    return colors

def generate_monochromatic(r, g, b):
    """Generate monochromatic color palette"""
    colors = []
    
    # Original color
    colors.append(rgb_to_hex(r, g, b))
    
    # Lighter variations
    colors.append(rgb_to_hex(min(int(r*1.3), 255), min(int(g*1.3), 255), min(int(b*1.3), 255)))
    colors.append(rgb_to_hex(min(int(r*1.6), 255), min(int(g*1.6), 255), min(int(b*1.6), 255)))
    
    # Darker variations
    colors.append(rgb_to_hex(int(r*0.7), int(g*0.7), int(b*0.7)))
    colors.append(rgb_to_hex(int(r*0.4), int(g*0.4), int(b*0.4)))
    
    return colors

@app.route('/api/competitor/find', methods=['POST'])
def find_competitors():
    """Find competitors based on business description and industry using OpenAI web search"""
    data = request.json
    
    if not data or 'businessDescription' not in data or 'industry' not in data:
        print("Error: Missing required parameters in competitor find request")
        return jsonify({"error": "Missing required parameters: businessDescription and industry"}), 400
    
    business_description = data['businessDescription']
    industry = data['industry']
    
    print(f"Finding competitors for: '{business_description}' in industry: '{industry}'")
    
    try:
        # Construct prompt for finding competitors
        search_query = f"Find 5 top competitors in the {industry} industry for a business described as: {business_description}. For each competitor, provide the name, website URL, a brief description, and reason why they're a competitor."
        
        print(f"Sending web search request to OpenAI with query: '{search_query}'")
        
        # Call OpenAI API with web search tool - forcing web search usage with tool_choice
        response = client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview", "search_context_size": "high"}],
            tool_choice={"type": "web_search_preview"},
            input=search_query
        )
        
        print("OpenAI web search response received")
        print(f"Response ID: {response.id}, Model used: {response.model}")
        
        # Get output text directly - the response structure is different than expected
        output_text = response.output_text
        print(f"Response preview: {output_text[:100]}...")
        
        # The new Responses API doesn't expose 'items' or easily access individual tool calls
        # So we'll check if output_text has content as an indication if web search worked
        if output_text and len(output_text) > 100:
            print("Web search appears to have succeeded based on response length")
        else:
            print("WARNING: Response text is suspiciously short. Web search may have failed.")
        
        # Extract competitor information from the response
        print("Extracting structured competitor information from response")
        competitors_info = extract_competitors_from_response(output_text)
        print(f"Successfully extracted {len(competitors_info)} competitors")
        
        # If no competitors were found, provide a fallback with generic competitors
        if not competitors_info or len(competitors_info) == 0:
            print(f"No competitors found, using fallback for {industry} industry")
            competitors_info = generate_fallback_competitors(industry)
            print(f"Generated {len(competitors_info)} fallback competitors")
        
        # For each competitor, automatically trigger analysis
        for i, competitor in enumerate(competitors_info):
            # Generate a job ID for the analysis
            job_id = f"job_{uuid.uuid4()}"
            competitor['jobId'] = job_id
            
            print(f"Setting up analysis job {job_id} for competitor {i+1}: {competitor['name']} ({competitor['url']})")
            
            # Store initial job status
            analysis_jobs[job_id] = {
                "status": "processing",
                "url": competitor['url'],
                "industry": industry,
                "created": time.time(),
                "logs": [f"Analysis job created at {time.strftime('%Y-%m-%d %H:%M:%S')}"],
                "results": None
            }
            
            # Start analysis in a background process
            # In a production environment, this should be a proper background task
            # For simplicity, we're using a direct call here
            analyze_competitor_website(job_id, competitor['url'], industry)
        
        return jsonify({
            "competitors": competitors_info,
            "message": "Competitor analysis started automatically for all URLs"
        })
    
    except Exception as e:
        error_message = f"Error finding competitors: {str(e)}"
        print(error_message)
        # Print stack trace for more detailed debugging
        traceback.print_exc()
        return jsonify({"error": error_message}), 500

@app.route('/api/competitor/analyze', methods=['POST'])
def analyze_competitor():
    """Analyze a competitor website using OpenAI web search"""
    data = request.json
    
    if not data or 'url' not in data:
        return jsonify({"error": "Missing URL parameter"}), 400
    
    url = data['url']
    industry = data.get('industry', '')
    
    try:
        # Generate a job ID for this analysis
        job_id = f"job_{uuid.uuid4()}"
        
        # Store initial job status
        analysis_jobs[job_id] = {
            "status": "processing",
            "url": url,
            "industry": industry,
            "created": time.time(),
            "results": None
        }
        
        # Start analysis in a separate thread (in a production environment)
        # For simplicity, we'll run it synchronously here, but this would be a background task
        analyze_competitor_website(job_id, url, industry)
        
        return jsonify({
            "message": "Analysis started",
            "jobId": job_id,
            "status": "processing"
        })
    
    except Exception as e:
        print(f"Error starting analysis: {str(e)}")
        return jsonify({"error": f"Failed to start analysis: {str(e)}"}), 500

@app.route('/api/competitor/status', methods=['POST'])
def check_analysis_status():
    """Check the status of one or more competitor analysis jobs"""
    data = request.json
    
    if not data or 'jobIds' not in data or not isinstance(data['jobIds'], list):
        return jsonify({"error": "Missing or invalid jobIds parameter"}), 400
    
    job_ids = data['jobIds']
    results = {}
    
    for job_id in job_ids:
        if job_id in analysis_jobs:
            job = analysis_jobs[job_id]
            result = {
                "status": job["status"],
                "url": job["url"],
                "created": job["created"]
            }
            
            if job["status"] == "completed" and job["results"]:
                result["results"] = job["results"]
            elif job["status"] == "failed" and "error" in job:
                result["error"] = job["error"]
                
            results[job_id] = result
        else:
            # Job not found - could be auto-created as pending for a better UX
            results[job_id] = {
                "status": "not_found",
                "error": "Analysis job not found"
            }
    
    return jsonify(results)

def extract_competitors_from_response(response_text):
    """Extract structured competitor information from OpenAI's response text"""
    competitors = []
    
    try:
        # Use OpenAI to parse its own response into structured competitor data
        parsing_prompt = f"""
        Extract the competitor information from the following text into a JSON structure with an array of competitors.
        Each competitor should have: name, url, description, and competitiveReason fields.
        
        Text to parse:
        {response_text}
        
        Respond ONLY with valid JSON in this exact format:
        [
          {{
            "name": "Competitor Name",
            "url": "https://competitor-website.com",
            "description": "Brief description of the competitor",
            "competitiveReason": "Why they are a competitor"
          }}
        ]
        """
        
        parsing_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": parsing_prompt}],
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        parsed_data = json.loads(parsing_response.choices[0].message.content)
        
        # If the response is a dict with a 'competitors' key, use that
        if isinstance(parsed_data, dict) and 'competitors' in parsed_data:
            competitors = parsed_data['competitors']
        # If it's a list, use it directly
        elif isinstance(parsed_data, list):
            competitors = parsed_data
    except Exception as e:
        print(f"Error parsing competitor data: {str(e)}")
        # Fallback to a simple parsing approach
        # This is a simplified approach that won't catch all cases
        sections = response_text.split("\n\n")
        for section in sections:
            if ":" in section and "http" in section.lower():
                lines = section.split("\n")
                name = lines[0].split(":")[0].strip()
                url_match = re.search(r'https?://[^\s]+', section)
                url = url_match.group(0) if url_match else "https://example.com"
                description = " ".join(lines[1:])[:200] if len(lines) > 1 else "No description available"
                competitors.append({
                    "name": name,
                    "url": url,
                    "description": description,
                    "competitiveReason": "Identified as a competitor in the same industry"
                })
        
        # If we still couldn't extract competitors, provide generic ones
        if not competitors:
            competitors = [
                {
                    "name": "Competitor 1",
                    "url": "https://example.com/competitor1",
                    "description": "A leading competitor in the industry",
                    "competitiveReason": "Similar service offerings and target market"
                },
                {
                    "name": "Competitor 2",
                    "url": "https://example.com/competitor2",
                    "description": "Another major player in the market",
                    "competitiveReason": "Established brand with overlapping customer base"
                }
            ]
    
    return competitors

def analyze_competitor_website(job_id, url, industry):
    """Analyze a competitor website using OpenAI's web search capabilities"""
    try:
        print(f"[{job_id}] Starting analysis of {url} in {industry} industry")
        
        # Update job with log
        if "logs" not in analysis_jobs[job_id]:
            analysis_jobs[job_id]["logs"] = []
        analysis_jobs[job_id]["logs"].append(f"Analysis started at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Create a detailed prompt for website analysis
        analysis_prompt = f"""
        Analyze the website {url} as a competitor in the {industry} industry. 
        Visit the website and provide a detailed analysis of:
        
        1. Visual design (colors, typography, layout)
        2. Key features and offerings
        3. Content strategy
        4. Strengths
        5. Weaknesses
        6. Unique selling points
        7. Elements worth drawing inspiration from
        
        Structure your analysis to be specific and actionable.
        """
        
        print(f"[{job_id}] Sending web search request to OpenAI for website analysis")
        analysis_jobs[job_id]["logs"].append(f"Querying OpenAI with web search at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Call OpenAI API with web search tool - forcing web search usage and high context
        response = client.responses.create(
            model="gpt-4o",
            tools=[{"type": "web_search_preview", "search_context_size": "high"}],
            tool_choice={"type": "web_search_preview"},
            input=analysis_prompt
        )
        
        print(f"[{job_id}] OpenAI web search response received for website analysis")
        analysis_jobs[job_id]["logs"].append(f"Received OpenAI response at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Get output text directly from the response
        output_text = response.output_text
        
        # Check if web search appears to have worked based on response length
        if output_text and len(output_text) > 200:
            log_msg = "Web search appears to have succeeded based on response length"
            print(f"[{job_id}] {log_msg}")
            analysis_jobs[job_id]["logs"].append(log_msg)
        else:
            warning_msg = "WARNING: Response text is suspiciously short. Web search may have failed."
            print(f"[{job_id}] {warning_msg}")
            analysis_jobs[job_id]["logs"].append(warning_msg)
        
        # Process the response to extract structured analysis data
        print(f"[{job_id}] Structuring analysis data")
        analysis_jobs[job_id]["logs"].append(f"Parsing analysis data at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        analysis_data = structure_analysis_data(output_text)
        
        # We can't extract citations directly from the new response format
        # but we'll include the raw text which may contain references
        analysis_data["rawContent"] = output_text[:1000]  # Limit to first 1000 chars
        
        # Update job with successful results
        print(f"[{job_id}] Analysis completed successfully")
        analysis_jobs[job_id]["logs"].append(f"Analysis completed successfully at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        analysis_jobs[job_id] = {
            **analysis_jobs[job_id],
            "status": "completed",
            "results": {
                "analysis": analysis_data,
                "screenshot": "/placeholder-hero.jpg",  # In production, would capture a real screenshot
                "completedAt": time.time()
            }
        }
    except Exception as e:
        error_message = f"Error analyzing website: {str(e)}"
        print(f"[{job_id}] {error_message}")
        analysis_jobs[job_id]["logs"].append(f"Error: {error_message} at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Print stack trace for more detailed debugging
        traceback.print_exc()
        
        # Update job with error status
        analysis_jobs[job_id] = {
            **analysis_jobs[job_id],
            "status": "failed",
            "error": error_message
        }

def structure_analysis_data(analysis_text):
    """Parse and structure the analysis text from OpenAI into a structured format"""
    try:
        # Use OpenAI to parse its own response into structured data
        parsing_prompt = f"""
        Parse the following website analysis into a structured JSON format with these sections:
        - visualDesign (with colors array, typography array, and layout string)
        - keyFeatures (array of strings)
        - contentStrategy (string)
        - strengths (array of strings)
        - weaknesses (array of strings)
        - uniqueSellingPoints (array of strings)
        - inspirationElements (array of strings)
        
        Analysis text:
        {analysis_text}
        
        Respond ONLY with valid JSON in this exact format:
        {{
          "visualDesign": {{
            "colors": ["#hexcolor1", "#hexcolor2", ...],
            "typography": ["Font1", "Font2", ...],
            "layout": "Description of layout"
          }},
          "keyFeatures": ["Feature 1", "Feature 2", ...],
          "contentStrategy": "Description of content strategy",
          "strengths": ["Strength 1", "Strength 2", ...],
          "weaknesses": ["Weakness 1", "Weakness 2", ...],
          "uniqueSellingPoints": ["USP 1", "USP 2", ...],
          "inspirationElements": ["Element 1", "Element 2", ...]
        }}
        """
        
        parsing_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": parsing_prompt}],
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        return json.loads(parsing_response.choices[0].message.content)
        
    except Exception as e:
        print(f"Error structuring analysis data: {str(e)}")
        # Return a fallback structured analysis
        return {
            "visualDesign": {
                "colors": ["#3B82F6", "#1E40AF", "#DBEAFE", "#F9FAFB", "#1F2937"],
                "typography": ["System font", "Sans-serif"],
                "layout": "Standard responsive layout with navigation, hero section, and content blocks"
            },
            "keyFeatures": [
                "Product/service offerings",
                "Contact information",
                "About us section"
            ],
            "contentStrategy": "Basic informational content explaining services and value proposition",
            "strengths": [
                "Clear presentation of offerings",
                "Professional appearance"
            ],
            "weaknesses": [
                "Limited detail on specific features",
                "Generic design elements"
            ],
            "uniqueSellingPoints": [
                "Industry experience",
                "Customer service focus"
            ],
            "inspirationElements": [
                "Clean navigation",
                "Mobile responsiveness",
                "Clear call-to-action elements"
            ],
            "citations": [],
            "rawAnalysis": analysis_text
        }

def generate_fallback_competitors(industry):
    """Generate fallback competitors when OpenAI web search fails to find results"""
    print(f"Generating fallback competitors for {industry} industry")
    
    # Map of predefined competitors by industry
    industry_competitors = {
        "technology": [
            {
                "name": "Microsoft",
                "url": "https://microsoft.com",
                "description": "Global technology company developing software, hardware, and services",
                "competitiveReason": "Leading provider of enterprise solutions and cloud services"
            },
            {
                "name": "Google",
                "url": "https://google.com",
                "description": "Technology company specializing in internet-related services and products",
                "competitiveReason": "Dominant force in search, cloud computing, and AI technologies"
            },
            {
                "name": "Amazon",
                "url": "https://amazon.com",
                "description": "E-commerce and cloud computing company",
                "competitiveReason": "Leader in cloud services with AWS and marketplace solutions"
            },
            {
                "name": "Apple",
                "url": "https://apple.com",
                "description": "Consumer electronics and software company",
                "competitiveReason": "Premium hardware and integrated ecosystem for consumers and businesses"
            },
            {
                "name": "Meta",
                "url": "https://meta.com",
                "description": "Social media and technology company",
                "competitiveReason": "Leading social platforms and advancing metaverse technologies"
            }
        ],
        "ecommerce": [
            {
                "name": "Shopify",
                "url": "https://shopify.com",
                "description": "E-commerce platform for online stores and retail point-of-sale systems",
                "competitiveReason": "Leading e-commerce platform for small to medium businesses"
            },
            {
                "name": "Amazon",
                "url": "https://amazon.com",
                "description": "Global e-commerce marketplace",
                "competitiveReason": "Largest online marketplace with extensive product selection"
            },
            {
                "name": "BigCommerce",
                "url": "https://bigcommerce.com",
                "description": "E-commerce platform for fast-growing and established brands",
                "competitiveReason": "Enterprise-grade e-commerce solution with robust features"
            },
            {
                "name": "WooCommerce",
                "url": "https://woocommerce.com",
                "description": "Open-source e-commerce plugin for WordPress",
                "competitiveReason": "Popular solution for WordPress-based e-commerce sites"
            },
            {
                "name": "Magento",
                "url": "https://magento.com",
                "description": "E-commerce platform built on open source technology",
                "competitiveReason": "Flexible platform for customized enterprise e-commerce solutions"
            }
        ],
        "saas": [
            {
                "name": "Salesforce",
                "url": "https://salesforce.com",
                "description": "Cloud-based software company specializing in CRM",
                "competitiveReason": "Leading CRM platform with extensive app ecosystem"
            },
            {
                "name": "HubSpot",
                "url": "https://hubspot.com",
                "description": "Inbound marketing, sales, and service software",
                "competitiveReason": "All-in-one marketing and sales platform for businesses of all sizes"
            },
            {
                "name": "Slack",
                "url": "https://slack.com",
                "description": "Business communication platform",
                "competitiveReason": "Popular team collaboration and messaging solution"
            },
            {
                "name": "Zoom",
                "url": "https://zoom.us",
                "description": "Video communications platform",
                "competitiveReason": "Leading video conferencing and collaboration tool"
            },
            {
                "name": "Microsoft 365",
                "url": "https://microsoft365.com",
                "description": "Productivity and collaboration tools suite",
                "competitiveReason": "Comprehensive productivity solutions for businesses"
            }
        ]
    }
    
    # Return industry-specific competitors if available
    industry_lower = industry.lower()
    for key in industry_competitors:
        if key in industry_lower or industry_lower in key:
            return industry_competitors[key]
    
    # Generate generic competitors with industry name for industries not in our predefined list
    return [
        {
            "name": f"{industry.title()} Leader",
            "url": "https://example-leader.com",
            "description": f"Leading provider in the {industry} industry",
            "competitiveReason": "Market leader with comprehensive offering"
        },
        {
            "name": f"{industry.title()} Innovator",
            "url": "https://example-innovator.com",
            "description": f"Innovative solutions for {industry} businesses",
            "competitiveReason": "Cutting-edge technology and exceptional user experience"
        },
        {
            "name": f"{industry.title()} Specialist",
            "url": "https://example-specialist.com",
            "description": f"Specialized {industry} services with industry expertise",
            "competitiveReason": "Deep domain knowledge and tailored solutions"
        },
        {
            "name": f"{industry.title()} Platform",
            "url": "https://example-platform.com",
            "description": f"User-friendly {industry} platform with extensive features",
            "competitiveReason": "Accessible solutions with strong customer support"
        },
        {
            "name": f"{industry.title()} Solutions",
            "url": "https://example-solutions.com",
            "description": f"Value-focused {industry} provider with competitive pricing",
            "competitiveReason": "Cost-effective options without sacrificing quality"
        }
    ]

if __name__ == '__main__':
    # Get port from environment variable or use 8080 as default
    port = int(os.environ.get('PORT', 8080))
    
    # Run the app with Gunicorn in production or Flask's development server locally
    if os.environ.get('ENVIRONMENT') == 'production':
        # Gunicorn will be used in production (Cloud Run)
        pass
    else:
        # Use Flask's development server for local development
        app.run(host='0.0.0.0', port=port, debug=True) 