const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const OpenAI = require('openai');
const readline = require('readline');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error(`Error loading service account key from ${serviceAccountPath}`);
  console.error('Please ensure you have a valid serviceAccountKey.json file in the project root');
  console.error('You can download this from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const db = getFirestore();
const storage = getStorage();
const websiteExamplesCollection = db.collection('websiteExamples');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

/**
 * Find top websites in a specific industry using OpenAI
 * @param {string} industry The industry to find websites for
 * @param {number} count Number of websites to return
 * @returns {Promise<Array<{url: string, description: string}>>}
 */
async function findTopIndustryWebsites(industry, count = 10) {
  try {
    console.log(`Finding top ${count} websites in the ${industry} industry...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Find the top ${count} websites in the ${industry} industry. 
          For each website, provide:
          1. The full URL (including https://)
          2. A brief description of what makes the design notable
          
          Format your response as a JSON object with a "websites" array containing objects with 'url' and 'description' properties.
          Example: {"websites": [{"url": "https://example.com", "description": "Notable for its minimalist design and intuitive navigation"}]}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Extract JSON from the response
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const data = JSON.parse(responseContent);
      if (Array.isArray(data.websites)) {
        return data.websites;
      } else {
        // Try to find any array in the response
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key];
          }
        }
        throw new Error('Could not find website array in response');
      }
    } catch (error) {
      console.error('Failed to parse JSON:', responseContent);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('Error finding top industry websites:', error);
    throw error;
  }
}

/**
 * Captures a full-page screenshot of a website
 * @param {string} url The website URL to capture
 * @returns {Promise<{buffer: Buffer, title: string, metadata: object}>}
 */
async function captureWebsiteScreenshot(url) {
  let browser;
  try {
    console.log(`Capturing screenshot for ${url}...`);
    
    // Launch browser with increased timeout for complex sites
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 60000, // 60 second timeout
    });

    const page = await browser.newPage();
    
    // Set a large viewport for better quality captures
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set longer timeouts for navigation and waiting
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);

    // Navigate to the URL with a longer timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait additional time for dynamic content to load
    await page.waitForTimeout(5000);

    // Get page title
    const title = await page.title();

    // Take a full-page screenshot
    const buffer = await page.screenshot({
      type: 'jpeg',
      quality: 90,
      fullPage: true,
    });

    return {
      buffer,
      title,
      metadata: {
        url,
        capturedAt: Date.now(),
        viewportWidth: 1920,
        viewportHeight: 1080,
      },
    };
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extracts CSS styles and design elements from a website
 * @param {string} url The website URL to analyze
 * @returns {Promise<object>} Extracted design elements
 */
async function extractWebsiteDesignElements(url) {
  let browser;
  try {
    console.log(`Extracting design elements from ${url}...`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 60000,
    });

    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Extract colors from CSS
    const colors = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const colorSet = new Set();
      
      // Helper to check if a string is a valid color
      const isColor = (str) => {
        return str.match(/^#([0-9A-F]{3}){1,2}$/i) || 
               str.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/) ||
               str.match(/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/);
      };
      
      // Process all stylesheets
      styleSheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule instanceof CSSStyleRule) {
              const style = rule.style;
              
              // Check color properties
              ['color', 'background-color', 'border-color', 'box-shadow'].forEach(prop => {
                const value = style.getPropertyValue(prop);
                if (value && isColor(value)) {
                  colorSet.add(value);
                }
              });
            }
          });
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
      
      return Array.from(colorSet);
    });

    // Extract fonts from CSS
    const fonts = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const fontSet = new Set();
      
      styleSheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule instanceof CSSStyleRule) {
              const fontFamily = rule.style.getPropertyValue('font-family');
              if (fontFamily) {
                fontSet.add(fontFamily.trim());
              }
            }
          });
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });
      
      return Array.from(fontSet);
    });

    // Extract component styles for common UI elements
    const componentStyles = await page.evaluate(() => {
      const components = {};
      
      // Extract button styles
      const buttons = document.querySelectorAll('button, .btn, [class*="button"]');
      if (buttons.length > 0) {
        const primaryButton = buttons[0];
        const style = window.getComputedStyle(primaryButton);
        
        components.button = {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
        };
      }
      
      // Extract form input styles
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
      if (inputs.length > 0) {
        const input = inputs[0];
        const style = window.getComputedStyle(input);
        
        components.input = {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          borderColor: style.borderColor,
          padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
          fontSize: style.fontSize,
        };
      }
      
      // Extract card/container styles
      const cards = document.querySelectorAll('.card, [class*="card"], .container, [class*="container"]');
      if (cards.length > 0) {
        const card = cards[0];
        const style = window.getComputedStyle(card);
        
        components.card = {
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
        };
      }
      
      return components;
    });

    return {
      colors,
      fonts,
      componentStyles,
    };
  } catch (error) {
    console.error(`Error extracting design elements for ${url}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Analyzes a screenshot using OpenAI's Vision model
 * @param {Buffer} imageBuffer Screenshot buffer
 * @returns {Promise<{components: Array, suggestedTags: Array, colors: Array}>}
 */
async function analyzeScreenshot(imageBuffer) {
  try {
    console.log('Analyzing screenshot with AI...');
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this website screenshot and provide the following information in JSON format:\n" +
                    "1. List of UI components with their type, description, and relevant tags\n" +
                    "2. Overall website style tags\n" +
                    "3. Main colors used in the design (hex codes)\n\n" +
                    "Format the response as a JSON object with these keys:\n" +
                    "{\n" +
                    "  \"components\": [{ \"id\": \"string\", \"name\": \"string\", \"description\": \"string\", \"componentType\": \"string\", \"tags\": [\"string\"] }],\n" +
                    "  \"suggestedTags\": [\"string\"],\n" +
                    "  \"colors\": [\"string\"]\n" +
                    "}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    // Get the response text
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const analysis = JSON.parse(responseContent);
      
      // Ensure the analysis has the required structure
      return {
        components: analysis.components?.map(comp => ({
          id: comp.id || `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: comp.name || 'Unknown Component',
          description: comp.description || '',
          componentType: comp.componentType || 'Other',
          tags: Array.isArray(comp.tags) ? comp.tags : [],
        })) || [],
        suggestedTags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags : [],
        colors: Array.isArray(analysis.colors) ? analysis.colors : [],
      };
    } catch (error) {
      console.error('Failed to parse JSON:', responseContent);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw error;
  }
}

/**
 * Get detailed design information about a specific website
 * @param {string} url The website URL to analyze
 * @returns {Promise<object>} Detailed design information
 */
async function getWebsiteDesignInfo(url) {
  try {
    console.log(`Getting design info for ${url}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on your knowledge, analyze the design of ${url} and provide the following information in JSON format:
          1. Main color palette (hex codes)
          2. Typography choices for headings, body text, and accents
          3. Notable UI components
          4. Overall design style descriptors
          5. Layout pattern
          
          Format your response as a JSON object with these keys:
          {
            "colors": ["#hexcode1", "#hexcode2", ...],
            "typography": {
              "headings": "font description",
              "body": "font description",
              "accents": "font description"
            },
            "components": ["component1", "component2", ...],
            "designStyle": ["style1", "style2", ...],
            "layoutPattern": "description"
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Extract JSON from the response
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response');
    }

    try {
      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse JSON:', responseContent);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('Error getting website design info:', error);
    throw error;
  }
}

/**
 * Uploads a screenshot to Firebase Storage
 * @param {Buffer} buffer Image buffer
 * @param {string} path Storage path
 * @returns {Promise<string>} Download URL
 */
async function uploadScreenshot(buffer, path) {
  try {
    console.log(`Uploading screenshot to ${path}...`);
    
    const file = storage.bucket().file(path);
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      }
    });
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });
    
    return url;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    throw error;
  }
}

/**
 * Analyzes a website and extracts design information
 * @param {string} url The website URL to analyze
 * @returns {Promise<object>} Complete website analysis
 */
async function analyzeWebsite(url) {
  try {
    console.log(`\n===== Starting analysis for ${url} =====`);
    
    // Step 1: Capture full page screenshot
    console.log('Capturing screenshot...');
    const screenshotData = await captureWebsiteScreenshot(url);
    
    // Step 2: Extract design elements using web scraping
    console.log('Extracting design elements...');
    const designElements = await extractWebsiteDesignElements(url);
    
    // Step 3: Analyze screenshot with AI
    console.log('Analyzing screenshot with AI...');
    const screenshotAnalysis = await analyzeScreenshot(screenshotData.buffer);
    
    // Step 4: Get additional design info using AI
    console.log('Getting additional design info...');
    const designInfo = await getWebsiteDesignInfo(url);
    
    // Step 5: Upload screenshot to Firebase Storage
    console.log('Uploading screenshot...');
    const screenshotId = uuidv4();
    const websiteId = uuidv4();
    const screenshotPath = `screenshots/${websiteId}/${screenshotId}.jpg`;
    const imageUrl = await uploadScreenshot(screenshotData.buffer, screenshotPath);
    
    // Step 6: Combine all data into a WebsiteExample
    const websiteExample = {
      title: screenshotData.title || new URL(url).hostname,
      description: `Design analysis of ${url}`,
      url: url,
      category: designInfo.designStyle.slice(0, 3), // Use design style as categories
      type: 'App', // Default type
      tags: [
        ...screenshotAnalysis.suggestedTags,
        ...designInfo.designStyle,
        ...designInfo.components.slice(0, 5)
      ],
      screenshots: [
        {
          id: screenshotId,
          imageUrl: imageUrl,
          altText: `Screenshot of ${url}`,
          description: `Full page screenshot of ${url}`,
          components: screenshotAnalysis.components
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Step 7: Save to database
    console.log('Saving to database...');
    await websiteExamplesCollection.doc(websiteId).set(websiteExample);
    
    console.log(`Analysis completed for ${url}`);
    return {
      websiteExample: {
        ...websiteExample,
        id: websiteId
      },
      designElements: {
        ...designElements,
        ...designInfo
      }
    };
  } catch (error) {
    console.error(`Error analyzing website ${url}:`, error);
    throw error;
  }
}

/**
 * Batch analyzes multiple websites in an industry
 * @param {string} industry The industry to analyze
 * @param {number} count Number of websites to analyze
 * @returns {Promise<Array>} Array of analysis results
 */
async function analyzeIndustryWebsites(industry, count = 5) {
  try {
    console.log(`\n===== Starting industry analysis for ${industry} =====`);
    
    // Step 1: Find top websites in the industry
    const websites = await findTopIndustryWebsites(industry, count);
    console.log(`Found ${websites.length} websites for ${industry}`);
    
    // Step 2: Analyze each website
    const results = [];
    
    for (let i = 0; i < websites.length; i++) {
      const website = websites[i];
      try {
        console.log(`\nAnalyzing website ${i + 1}/${websites.length}: ${website.url}...`);
        const analysis = await analyzeWebsite(website.url);
        
        // Update description with the one from AI
        await websiteExamplesCollection.doc(analysis.websiteExample.id).update({
          description: website.description
        });
        
        analysis.websiteExample.description = website.description;
        results.push(analysis);
        
        // Add a delay between requests to avoid rate limiting
        if (i < websites.length - 1) {
          console.log('Waiting before next website...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Error analyzing ${website.url}:`, error);
        // Continue with other websites
      }
    }
    
    console.log(`\n===== Completed analysis for ${results.length}/${websites.length} websites in ${industry} industry =====`);
    return results;
  } catch (error) {
    console.error(`Error analyzing industry ${industry}:`, error);
    throw error;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    console.log('===== Website Design Collector =====');
    console.log('This script will analyze websites and save design data to Firebase');
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY environment variable is not set');
      console.error('Please set it before running this script:');
      console.error('export OPENAI_API_KEY=your_api_key_here');
      process.exit(1);
    }
    
    // Ask for mode
    const mode = await prompt('Choose mode:\n1. Analyze a single website\n2. Analyze an industry\nEnter choice (1 or 2): ');
    
    if (mode === '1') {
      // Single website mode
      const url = await prompt('Enter website URL (include https://): ');
      
      console.log(`Starting analysis for ${url}...`);
      const result = await analyzeWebsite(url);
      
      console.log('\nAnalysis completed successfully!');
      console.log(`Website saved with ID: ${result.websiteExample.id}`);
      
      // Save result to a JSON file for reference
      const outputPath = path.join(__dirname, `../output/website_${result.websiteExample.id}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Full analysis saved to: ${outputPath}`);
      
    } else if (mode === '2') {
      // Industry mode
      const industry = await prompt('Enter industry name: ');
      const countStr = await prompt('Number of websites to analyze (default: 5): ');
      const count = parseInt(countStr) || 5;
      
      console.log(`Starting analysis for ${count} websites in ${industry} industry...`);
      const results = await analyzeIndustryWebsites(industry, count);
      
      console.log('\nAnalysis completed successfully!');
      console.log(`Analyzed ${results.length} websites`);
      
      // Save results to a JSON file for reference
      const outputPath = path.join(__dirname, `../output/industry_${industry.replace(/\s+/g, '_')}_${Date.now()}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Full analysis saved to: ${outputPath}`);
      
    } else {
      console.error('Invalid choice. Please enter 1 or 2.');
    }
    
  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();
