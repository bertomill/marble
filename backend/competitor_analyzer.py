from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import requests
import os
import json
import uuid
import time
import base64
from io import BytesIO
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to load environment variables from .env.local, but don't fail if it doesn't exist.
try:
    if os.path.exists('.env.local'):
        load_dotenv('.env.local')
except Exception as e:
    logger.warning(f"Could not load .env.local: {e}")

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

class CompetitorAnalyzer:
    def __init__(self):
        self.chrome_options = Options()
        self.chrome_options.add_argument("--headless")
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")
        self.chrome_options.add_argument("--window-size=1920,1080")
        
        # Dict to store analysis results
        self.analysis_cache = {}
    
    def setup_driver(self):
        """Initialize and return a headless Chrome driver"""
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=self.chrome_options)
            return driver
        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            raise
    
    def find_competitors(self, business_description, industry):
        """Find top competitors for a business using OpenAI's web search"""
        logger.info(f"Finding competitors for {industry} business: {business_description}")
        
        try:
            # Get search context size from environment variable or default to high
            search_context_size = os.environ.get('COMPETITOR_SEARCH_CONTEXT', 'high')
            logger.info(f"Using search context size: {search_context_size}")
            
            # Create search query based on business information
            search_query = f"Find top 5 competitors for a {industry} business that {business_description}"
            
            # Use OpenAI to search for competitors
            search_response = client.responses.create(
                model="gpt-4o",
                tools=[{"type": "web_search_preview", "search_context_size": search_context_size}],
                tool_choice={"type": "web_search_preview"},
                input=search_query
            )
            
            # Extract the search result text
            search_results = search_response.output_text
            
            # Now ask GPT to analyze the search results and extract structured competitor information
            analysis_prompt = f"""
            Based on the following web search results about competitors in the {industry} industry, 
            extract information for the top 5 competitors. For each competitor provide:
            1. Company name
            2. REAL and WORKING Website URL (important: must be the actual website, not a placeholder)
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
                    url = comp.get("url", "").strip()
                    
                    # Ensure URL has http/https prefix
                    if url and not url.startswith(('http://', 'https://')):
                        url = 'https://' + url
                    
                    competitors.append({
                        "name": comp.get("name", f"Competitor {i+1}"),
                        "url": url,
                        "description": comp.get("description", "No description available"),
                        "competitiveReason": comp.get("competitiveReason", "Competitor in your industry"),
                        "jobId": job_id,
                        "status": "pending"  # Initial status for the analysis job
                    })
                
                # Start the analysis process for each competitor asynchronously
                for competitor in competitors:
                    # Start analysis in the background - in a production environment, 
                    # you would use a task queue (Celery, Redis Queue, etc.)
                    self.analyze_competitor_website(competitor["url"], competitor["jobId"])
                    
            except Exception as e:
                logger.error(f"Error parsing competitor data: {str(e)}")
                # Provide some fallback data
                job_id_base = uuid.uuid4().hex[:12]
                competitors = self._generate_fallback_competitors(job_id_base)
            
            return {"competitors": competitors, "message": "Competitor analysis started"}
            
        except Exception as e:
            logger.error(f"Error in find_competitors: {str(e)}")
            raise
    
    def analyze_competitor_website(self, url, job_id):
        """
        Analyze a competitor website using Selenium to capture screenshots and analyze tech stack
        This method is meant to run asynchronously (in a real-world scenario, through a task queue)
        """
        logger.info(f"Starting analysis for {url} with job ID {job_id}")
        
        # Mark the job as processing
        self.analysis_cache[job_id] = {
            "status": "processing",
            "message": "Analysis in progress",
            "timestamp": time.time()
        }
        
        try:
            # Initialize the WebDriver
            driver = self.setup_driver()
            
            try:
                # Visit the website
                driver.get(url)
                
                # Allow time for the page to load
                time.sleep(5)  # Increased wait time for better page loading
                
                # Take a full page screenshot of the homepage
                screenshots = {}
                
                # Take homepage screenshot
                screenshot = driver.get_screenshot_as_png()
                screenshots["homepage"] = base64.b64encode(screenshot).decode('utf-8')
                
                # Get page source for analysis
                page_source = driver.page_source
                
                # Try to navigate to about page
                about_url = self._find_about_page(driver, url)
                if about_url:
                    try:
                        driver.get(about_url)
                        time.sleep(3)
                        screenshot = driver.get_screenshot_as_png()
                        screenshots["about"] = base64.b64encode(screenshot).decode('utf-8')
                    except Exception as e:
                        logger.warning(f"Failed to capture about page: {e}")
                
                # Try to navigate to products/services page
                products_url = self._find_products_page(driver, url)
                if products_url:
                    try:
                        driver.get(products_url)
                        time.sleep(3)
                        screenshot = driver.get_screenshot_as_png()
                        screenshots["products"] = base64.b64encode(screenshot).decode('utf-8')
                    except Exception as e:
                        logger.warning(f"Failed to capture products page: {e}")
                
                # Return to homepage for additional analysis
                driver.get(url)
                time.sleep(2)
                
                # Analyze the tech stack
                tech_stack = self._analyze_tech_stack(driver, page_source)
                
                # Analyze design elements
                design_elements = self._analyze_design(driver, page_source)
                
                # Analyze SEO elements
                seo_elements = self._analyze_seo(driver, page_source)
                
                # Analyze performance metrics
                performance_metrics = self._analyze_performance(driver)
                
                # Store the results
                self.analysis_cache[job_id] = {
                    "status": "completed",
                    "results": {
                        "url": url,
                        "screenshots": screenshots,
                        "techStack": tech_stack,
                        "design": design_elements,
                        "seo": seo_elements,
                        "performance": performance_metrics,
                        "timestamp": time.time()
                    }
                }
                
                logger.info(f"Completed analysis for {url}")
            
            finally:
                # Clean up the driver
                driver.quit()
        
        except Exception as e:
            logger.error(f"Error analyzing website {url}: {str(e)}")
            
            # Update the job status with the error
            self.analysis_cache[job_id] = {
                "status": "error",
                "message": f"Analysis failed: {str(e)}",
                "timestamp": time.time()
            }
    
    def _find_about_page(self, driver, base_url):
        """Find the about page URL by looking for common about page links"""
        try:
            # Go back to the base URL first
            driver.get(base_url)
            time.sleep(1)
            
            # Look for common about page links
            about_selectors = [
                "a[href*='about']", 
                "a[href*='company']",
                "a[href*='who-we-are']",
                "a[href*='our-story']",
                "a[href*='team']"
            ]
            
            for selector in about_selectors:
                elements = driver.find_elements("css selector", selector)
                for element in elements:
                    href = element.get_attribute("href")
                    if href:
                        return href
            
            return None
        except Exception as e:
            logger.warning(f"Error finding about page: {e}")
            return None
    
    def _find_products_page(self, driver, base_url):
        """Find the products or services page URL"""
        try:
            # Go back to the base URL first
            driver.get(base_url)
            time.sleep(1)
            
            # Look for common product/service page links
            product_selectors = [
                "a[href*='product']", 
                "a[href*='service']",
                "a[href*='solution']",
                "a[href*='offering']",
                "a[href*='shop']",
                "a[href*='store']"
            ]
            
            for selector in product_selectors:
                elements = driver.find_elements("css selector", selector)
                for element in elements:
                    href = element.get_attribute("href")
                    if href:
                        return href
            
            return None
        except Exception as e:
            logger.warning(f"Error finding products page: {e}")
            return None
    
    def _analyze_tech_stack(self, driver, page_source):
        """Analyze the tech stack of a website based on page source and JS variables"""
        tech_stack = {
            "frontend": [],
            "backend": [],
            "frameworks": [],
            "analytics": [],
            "hosting": [],
            "ecommerce": [],
            "cms": []
        }
        
        # Enhanced frontend technology detection
        frontend_techs = {
            "React": ["react", "ReactDOM", "__NEXT_DATA__", "createElement("],
            "Vue.js": ["Vue", "vue.js", "__vue__", "v-bind", "v-for"],
            "Angular": ["ng-", "angular", "ng.probe", "NgModule"],
            "jQuery": ["jQuery", "jquery"],
            "Next.js": ["__NEXT_DATA__", "next/"],
            "Svelte": ["svelte", "SvelteComponent"],
            "Alpine.js": ["alpine", "x-data", "x-bind"]
        }
        
        for tech, patterns in frontend_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["frontend"]:
                        tech_stack["frontend"].append(tech)
                    break
        
        # Check for common frameworks
        framework_techs = {
            "Bootstrap": ["bootstrap", "navbar-toggle", "col-md-"],
            "Tailwind CSS": ["tailwind", "md:", "lg:", "sm:", "-tw-"],
            "Material UI": ["MuiButton", "MuiAppBar", "withStyles"],
            "Chakra UI": ["chakra", "ChakraProvider"],
            "Bulma": ["bulma", "is-primary", "is-info"]
        }
        
        for tech, patterns in framework_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["frameworks"]:
                        tech_stack["frameworks"].append(tech)
                    break
        
        # Check for analytics tools
        analytics_techs = {
            "Google Analytics": ["gtag", "GoogleAnalytics", "google-analytics", "UA-"],
            "Google Tag Manager": ["gtm", "googletagmanager"],
            "Facebook Pixel": ["fbq(", "facebook-pixel", "connect.facebook.net"],
            "Hotjar": ["hotjar", "_hjSettings"],
            "Segment": ["analytics.segment.com", "analytics.track"]
        }
        
        for tech, patterns in analytics_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["analytics"]:
                        tech_stack["analytics"].append(tech)
                    break
        
        # Check for CMS
        cms_techs = {
            "WordPress": ["wp-content", "wp-includes", "wpemoji"],
            "Drupal": ["Drupal", "drupal"],
            "Joomla": ["joomla", "Joomla"],
            "Ghost": ["ghost", "Ghost"],
            "Contentful": ["contentful"],
            "Strapi": ["strapi"]
        }
        
        for tech, patterns in cms_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["cms"]:
                        tech_stack["cms"].append(tech)
                    break
        
        # Check for ecommerce platforms
        ecommerce_techs = {
            "Shopify": ["Shopify", "shopify"],
            "WooCommerce": ["woocommerce", "WooCommerce"],
            "Magento": ["magento", "Magento"],
            "BigCommerce": ["bigcommerce"],
            "Salesforce Commerce": ["demandware"],
            "PrestaShop": ["prestashop"]
        }
        
        for tech, patterns in ecommerce_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["ecommerce"]:
                        tech_stack["ecommerce"].append(tech)
                    break
        
        # Detect hosting/infrastructure
        hosting_techs = {
            "Vercel": ["vercel", "/_vercel/"],
            "Netlify": ["netlify"],
            "AWS": ["aws-amplify", "amazonaws.com", "cloudfront.net"],
            "GitHub Pages": ["github.io"],
            "Cloudflare": ["cloudflare", "__cf_"],
            "Firebase": ["firebaseapp.com", "firebase"]
        }
        
        for tech, patterns in hosting_techs.items():
            for pattern in patterns:
                if pattern in page_source:
                    if tech not in tech_stack["hosting"]:
                        tech_stack["hosting"].append(tech)
                    break
        
        # Detect other technologies using JavaScript
        try:
            # WordPress
            wordpress = driver.execute_script("return typeof wp !== 'undefined' || document.querySelector('meta[name=\"generator\"][content*=\"WordPress\"]') !== null")
            if wordpress and "WordPress" not in tech_stack["cms"]:
                tech_stack["cms"].append("WordPress")
            
            # Shopify
            shopify = driver.execute_script("return typeof Shopify !== 'undefined' || document.querySelector('meta[name=\"generator\"][content*=\"Shopify\"]') !== null")
            if shopify and "Shopify" not in tech_stack["ecommerce"]:
                tech_stack["ecommerce"].append("Shopify")
            
            # Wix
            wix = driver.execute_script("return typeof wixBiSession !== 'undefined' || document.querySelector('meta[name=\"generator\"][content*=\"Wix\"]') !== null")
            if wix and "Wix" not in tech_stack["cms"]:
                tech_stack["cms"].append("Wix")
                
            # Look for server-side technologies in the response headers and meta tags
            server = driver.execute_script("return document.querySelector('meta[name=\"generator\"]') ? document.querySelector('meta[name=\"generator\"]').getAttribute('content') : null")
            if server:
                backend_techs = {
                    "PHP": ["PHP", "php"],
                    "ASP.NET": ["ASP.NET", "aspx"],
                    "Node.js": ["Node", "nodejs", "Express"],
                    "Django": ["Django"],
                    "Ruby on Rails": ["Ruby on Rails", "rails"],
                    "Python": ["Python", "Flask", "Django"]
                }
                
                for tech, patterns in backend_techs.items():
                    for pattern in patterns:
                        if pattern in server:
                            if tech not in tech_stack["backend"]:
                                tech_stack["backend"].append(tech)
                            break
            
        except Exception as e:
            logger.warning(f"Error during JavaScript execution for tech detection: {e}")
        
        # If we couldn't identify specific technologies, use a fallback
        if not any(tech_stack.values()):
            tech_stack["frontend"].append("HTML/CSS/JavaScript")
        
        return tech_stack
    
    def _analyze_design(self, driver, page_source):
        """Analyze the design elements of a website"""
        design = {
            "colors": [],
            "fonts": [],
            "layout": "Standard multi-column layout",
            "responsiveness": "Responsive design detected"
        }
        
        try:
            # Extract color scheme using JavaScript
            colors = driver.execute_script("""
                const colors = [];
                const elements = document.querySelectorAll('*');
                const processedColors = new Set();
                
                for (let i = 0; i < Math.min(elements.length, 100); i++) {
                    const el = elements[i];
                    const style = window.getComputedStyle(el);
                    const backgroundColor = style.backgroundColor;
                    const color = style.color;
                    
                    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && !processedColors.has(backgroundColor)) {
                        processedColors.add(backgroundColor);
                        colors.push(backgroundColor);
                    }
                    
                    if (color && color !== 'rgba(0, 0, 0, 0)' && !processedColors.has(color)) {
                        processedColors.add(color);
                        colors.push(color);
                    }
                }
                
                return Array.from(processedColors).slice(0, 5);
            """)
            
            design["colors"] = colors if colors else ["#FFFFFF", "#000000", "#333333"]
            
            # Extract fonts
            fonts = driver.execute_script("""
                const fonts = [];
                const fontSet = new Set();
                const elements = document.querySelectorAll('h1, h2, h3, p, span, a, button');
                
                for (let i = 0; i < Math.min(elements.length, 50); i++) {
                    const el = elements[i];
                    const style = window.getComputedStyle(el);
                    const fontFamily = style.fontFamily;
                    
                    if (fontFamily && !fontSet.has(fontFamily)) {
                        fontSet.add(fontFamily);
                        fonts.push(fontFamily);
                    }
                }
                
                return Array.from(fontSet).slice(0, 3);
            """)
            
            design["fonts"] = fonts if fonts else ["Arial", "sans-serif"]
            
            # Check responsiveness
            is_responsive = driver.execute_script("""
                return window.matchMedia && (
                    document.querySelector('meta[name="viewport"]') !== null ||
                    document.querySelectorAll('*[class*="mobile"], *[class*="responsive"], *[class*="sm:"], *[class*="md:"], *[class*="lg:"]').length > 0
                );
            """)
            
            if is_responsive:
                design["responsiveness"] = "Responsive design detected"
            else:
                design["responsiveness"] = "May not be fully responsive"
            
        except Exception as e:
            logger.warning(f"Error during design analysis: {e}")
            # Use fallback values if execution fails
            design["colors"] = ["#FFFFFF", "#000000", "#333333", "#F3F3F3", "#666666"]
            design["fonts"] = ["Arial", "sans-serif"]
        
        return design
    
    def _analyze_seo(self, driver, page_source):
        """Analyze SEO elements of the website"""
        seo = {
            "title": "",
            "meta_description": "",
            "meta_keywords": "",
            "h1_count": 0,
            "image_alt_percentage": 0,
            "has_sitemap": False,
            "issues": []
        }
        
        try:
            # Extract title
            seo["title"] = driver.execute_script("return document.title || ''")
            
            # Extract meta description
            meta_desc = driver.execute_script("return document.querySelector('meta[name=\"description\"]') ? document.querySelector('meta[name=\"description\"]').getAttribute('content') : ''")
            seo["meta_description"] = meta_desc or ""
            
            # Extract meta keywords
            meta_keywords = driver.execute_script("return document.querySelector('meta[name=\"keywords\"]') ? document.querySelector('meta[name=\"keywords\"]').getAttribute('content') : ''")
            seo["meta_keywords"] = meta_keywords or ""
            
            # Count H1 tags
            h1_count = driver.execute_script("return document.getElementsByTagName('h1').length")
            seo["h1_count"] = h1_count
            
            # Check for alt text on images
            alt_percentage = driver.execute_script("""
                const images = document.getElementsByTagName('img');
                if (images.length === 0) return 100;
                let imagesWithAlt = 0;
                for (let i = 0; i < images.length; i++) {
                    if (images[i].alt && images[i].alt.trim() !== '') {
                        imagesWithAlt++;
                    }
                }
                return Math.round((imagesWithAlt / images.length) * 100);
            """)
            seo["image_alt_percentage"] = alt_percentage
            
            # Check common sitemap locations
            sitemap_found = False
            sitemap_urls = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap/"]
            original_url = driver.current_url
            
            for sitemap_url in sitemap_urls:
                try:
                    full_url = original_url.rstrip('/') + sitemap_url
                    driver.get(full_url)
                    # Check if page loaded and if it contains sitemap data
                    if 'xml' in driver.page_source.lower() and ('urlset' in driver.page_source.lower() or 'sitemapindex' in driver.page_source.lower()):
                        sitemap_found = True
                        break
                except:
                    pass
            
            # Go back to original URL
            driver.get(original_url)
            seo["has_sitemap"] = sitemap_found
            
            # Identify SEO issues
            issues = []
            
            if not seo["title"]:
                issues.append("Missing page title")
            elif len(seo["title"]) < 10:
                issues.append("Title is too short")
            elif len(seo["title"]) > 60:
                issues.append("Title is too long")
                
            if not seo["meta_description"]:
                issues.append("Missing meta description")
            elif len(seo["meta_description"]) < 50:
                issues.append("Meta description is too short")
            elif len(seo["meta_description"]) > 160:
                issues.append("Meta description is too long")
                
            if h1_count == 0:
                issues.append("No H1 tag found")
            elif h1_count > 1:
                issues.append("Multiple H1 tags found")
                
            if alt_percentage < 80:
                issues.append("Many images missing alt text")
                
            if not sitemap_found:
                issues.append("No sitemap found")
                
            seo["issues"] = issues
                
        except Exception as e:
            logger.warning(f"Error during SEO analysis: {e}")
            seo["issues"].append("Error analyzing SEO elements")
            
        return seo
        
    def _analyze_performance(self, driver):
        """Analyze basic performance metrics using Navigation Timing API"""
        performance = {
            "load_time": 0,
            "dom_content_loaded": 0,
            "first_paint": 0,
            "resources_count": 0,
            "resources_size": 0,
            "score": "Unknown"
        }
        
        try:
            # Get performance metrics using Navigation Timing API
            timing = driver.execute_script("""
                const perfData = window.performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                const domLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                
                // Get resource timing data
                let totalSize = 0;
                const resources = performance.getEntriesByType('resource');
                
                for (let i = 0; i < resources.length; i++) {
                    if (resources[i].transferSize) {
                        totalSize += resources[i].transferSize;
                    }
                }
                
                return {
                    loadTime: loadTime,
                    domLoaded: domLoaded,
                    resourcesCount: resources.length,
                    resourcesSize: Math.round(totalSize / 1024) // KB
                };
            """)
            
            if timing:
                performance["load_time"] = timing.get("loadTime", 0)
                performance["dom_content_loaded"] = timing.get("domLoaded", 0)
                performance["resources_count"] = timing.get("resourcesCount", 0)
                performance["resources_size"] = timing.get("resourcesSize", 0)
                
                # Calculate a simple performance score
                load_time = timing.get("loadTime", 0)
                if load_time < 1000:
                    performance["score"] = "Excellent"
                elif load_time < 2500:
                    performance["score"] = "Good"
                elif load_time < 5000:
                    performance["score"] = "Average"
                else:
                    performance["score"] = "Slow"
                
        except Exception as e:
            logger.warning(f"Error analyzing performance: {e}")
            
        return performance
    
    def get_analysis_status(self, job_ids):
        """Get the status of competitor analysis jobs"""
        status_results = {}
        
        for job_id in job_ids:
            # Check if we have the job in our cache
            if job_id in self.analysis_cache:
                status_results[job_id] = self.analysis_cache[job_id]
            else:
                # For any job we don't have in storage yet
                status_results[job_id] = {
                    "status": "pending",
                    "message": "Analysis queued but not yet started"
                }
        
        return status_results
    
    def _generate_fallback_competitors(self, job_id_base, count=5):
        """Generate fallback competitors when the API fails"""
        competitors = []
        
        fallback_data = [
            {
                "name": "Wix",
                "url": "https://www.wix.com",
                "description": "Website builder platform for creating professional websites without coding"
            },
            {
                "name": "Squarespace",
                "url": "https://www.squarespace.com",
                "description": "Design-focused website building platform with templates for various industries"
            },
            {
                "name": "Shopify",
                "url": "https://www.shopify.com",
                "description": "E-commerce platform for online stores and retail point-of-sale systems"
            },
            {
                "name": "WordPress",
                "url": "https://wordpress.org",
                "description": "Open-source content management system for websites and blogs"
            },
            {
                "name": "Webflow",
                "url": "https://webflow.com",
                "description": "Visual web design platform that allows you to build responsive websites"
            }
        ]
        
        for i in range(min(count, len(fallback_data))):
            job_id = f"{job_id_base}_{i}"
            
            competitors.append({
                "name": fallback_data[i]["name"],
                "url": fallback_data[i]["url"],
                "description": fallback_data[i]["description"],
                "competitiveReason": "Major website building platform",
                "jobId": job_id,
                "status": "pending"
            })
            
            # Start fallback analysis
            self.analyze_competitor_website(fallback_data[i]["url"], job_id)
        
        return competitors

# Create flask app and competitor analyzer instance
app = Flask(__name__)
CORS(app, origins="*")
analyzer = CompetitorAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Enhanced competitor analysis API is running"}), 200

@app.route('/api/competitor/find', methods=['POST'])
def find_competitors():
    """Endpoint to find and analyze competitors"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Missing request data"}), 400
    
    business_description = data.get('businessDescription', '')
    industry = data.get('industry', '')
    
    if not industry and not business_description:
        return jsonify({"error": "Both industry and business description cannot be empty"}), 400
    
    try:
        result = analyzer.find_competitors(business_description, industry)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error finding competitors: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/competitor/status', methods=['POST'])
def get_analysis_status():
    """Endpoint to get the status of competitor analysis jobs"""
    data = request.json
    
    if not data or not data.get('jobIds'):
        return jsonify({"error": "Missing jobIds parameter"}), 400
    
    job_ids = data.get('jobIds')
    
    try:
        status_results = analyzer.get_analysis_status(job_ids)
        return jsonify(status_results)
    except Exception as e:
        logger.error(f"Error getting analysis status: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Get port from environment variable or use 8080 as default
    default_port = int(os.environ.get('PORT', 8080))
    port = default_port
    max_port_attempts = 10
    
    # Try different ports if the default one is in use
    for attempt in range(max_port_attempts):
        try:
            logger.info(f"Starting server on port {port}")
            # Use threaded=True to handle concurrent requests better
            app.run(host='0.0.0.0', port=port, debug=True, threaded=True, use_reloader=False)
            break  # If we get here, the server started successfully
        except OSError as e:
            if "Address already in use" in str(e) and attempt < max_port_attempts - 1:
                port = default_port + attempt + 1
                logger.warning(f"Port {port-1} is in use, trying port {port}")
                # Update the env variable for the frontend to connect to the right port
                os.environ['NEXT_PUBLIC_PYTHON_BACKEND_URL'] = f"http://localhost:{port}"
            else:
                logger.error(f"Could not start server: {e}")
                raise 