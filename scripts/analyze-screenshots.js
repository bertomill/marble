const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
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
 * Analyzes a screenshot using OpenAI's Vision model
 * @param {string} imagePath Path to the image file
 * @returns {Promise<{components: Array, suggestedTags: Array, colors: Array, functionalPurpose: Array, userJourneyStage: string, industryRelevance: Array, userTasks: Array}>}
 */
async function analyzeScreenshot(imagePath) {
  try {
    console.log(`Analyzing screenshot: ${imagePath}...`);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this website screenshot and provide a detailed UI design analysis in JSON format. Include:\n" +
                    "1. UI Components: Identify all UI components with their type, description, purpose, and design characteristics\n" +
                    "2. Color Palette: Extract the main colors (hex codes) and describe their usage (primary, secondary, accent, etc.)\n" +
                    "3. Typography: Analyze font families, sizes, weights, and hierarchy\n" +
                    "4. Layout Pattern: Identify the layout structure, grid system, and spacing patterns\n" +
                    "5. Design Style: Categorize the overall design style (e.g., minimalist, skeuomorphic, material design)\n" +
                    "6. Accessibility Observations: Note any accessibility considerations\n" +
                    "7. Design Patterns: Identify common UI/UX patterns used\n" +
                    "8. Functional Purpose: Identify what this page/screen is designed to help users accomplish\n" +
                    "9. User Journey Stage: Identify where this screen fits in a typical user journey (e.g., onboarding, checkout, dashboard)\n" +
                    "10. Industry Relevance: List industries where this design pattern would be most applicable\n" +
                    "11. User Tasks: List specific user tasks this interface supports\n\n" +
                    "Format the response as a JSON object with these keys:\n" +
                    "{\n" +
                    "  \"components\": [{ \"id\": \"string\", \"name\": \"string\", \"description\": \"string\", \"componentType\": \"string\", \"tags\": [\"string\"], \"designCharacteristics\": \"string\" }],\n" +
                    "  \"colorPalette\": [{ \"hex\": \"string\", \"usage\": \"string\" }],\n" +
                    "  \"typography\": { \"headings\": \"string\", \"body\": \"string\", \"accents\": \"string\", \"hierarchy\": \"string\" },\n" +
                    "  \"layout\": { \"pattern\": \"string\", \"grid\": \"string\", \"spacing\": \"string\" },\n" +
                    "  \"designStyle\": [\"string\"],\n" +
                    "  \"accessibilityNotes\": \"string\",\n" +
                    "  \"designPatterns\": [\"string\"],\n" +
                    "  \"functionalPurpose\": [\"string\"],\n" +
                    "  \"userJourneyStage\": \"string\",\n" +
                    "  \"industryRelevance\": [\"string\"],\n" +
                    "  \"userTasks\": [\"string\"],\n" +
                    "  \"suggestedTags\": [\"string\"]\n" +
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
      response_format: { type: "json_object" },
      max_tokens: 4096
    });

    // Get the response text
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response');
    }

    try {
      const analysis = JSON.parse(responseContent);
      console.log('Analysis completed successfully');
      return analysis;
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
 * Uploads a screenshot to Firebase Storage
 * @param {string} imagePath Path to the image file
 * @param {string} storagePath Storage path
 * @returns {Promise<string>} Download URL
 */
async function uploadScreenshot(imagePath, storagePath) {
  try {
    console.log(`Uploading screenshot to ${storagePath}...`);
    
    const file = storage.bucket().file(storagePath);
    await file.save(fs.readFileSync(imagePath), {
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
 * Saves a website example to Firestore
 * @param {object} websiteExample Website example data
 * @returns {Promise<string>} Document ID
 */
async function saveWebsiteExample(websiteExample) {
  try {
    console.log('Saving to database...');
    const docRef = await websiteExamplesCollection.add(websiteExample);
    return docRef.id;
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
}

/**
 * Process a single screenshot
 * @param {string} imagePath Path to the image file
 * @param {object} metadata Metadata for the screenshot
 * @returns {Promise<object>} Processing result
 */
async function processScreenshot(imagePath, metadata) {
  try {
    console.log(`\n===== Processing screenshot: ${imagePath} =====`);
    
    // Step 1: Analyze screenshot with AI
    console.log('Analyzing screenshot with AI...');
    const analysis = await analyzeScreenshot(imagePath);
    
    // Step 2: Upload screenshot to Firebase Storage
    console.log('Uploading screenshot...');
    const screenshotId = uuidv4();
    const websiteId = uuidv4();
    const screenshotPath = `screenshots/${websiteId}/${screenshotId}.jpg`;
    const imageUrl = await uploadScreenshot(imagePath, screenshotPath);
    
    // Combine all relevant tags for better searchability
    const combinedTags = [
      ...(analysis.suggestedTags || []),
      ...(analysis.designPatterns || []),
      ...(analysis.functionalPurpose || []),
      ...(analysis.userTasks || []),
      analysis.userJourneyStage ? [analysis.userJourneyStage] : [],
      ...(metadata.tags || [])
    ].filter(Boolean);
    
    // Step 3: Create website example object
    const websiteExample = {
      title: metadata.title || path.basename(imagePath, path.extname(imagePath)),
      description: metadata.description || `Design analysis of ${metadata.title || 'website'}`,
      url: metadata.url || '',
      category: metadata.category || analysis.industryRelevance || analysis.designStyle || [],
      type: metadata.type || 'Screen',
      tags: combinedTags,
      functionalPurpose: analysis.functionalPurpose || [],
      userJourneyStage: analysis.userJourneyStage || '',
      screenshots: [
        {
          id: screenshotId,
          imageUrl: imageUrl,
          altText: metadata.altText || `Screenshot of ${metadata.title || 'website'}`,
          description: metadata.screenshotDescription || `Screenshot of ${metadata.title || 'website'}`,
          components: analysis.components || []
        }
      ],
      designSystem: {
        colors: analysis.colorPalette || [],
        typography: analysis.typography || {},
        layout: analysis.layout || {},
        designStyle: analysis.designStyle || [],
        accessibilityNotes: analysis.accessibilityNotes || '',
        functionalPurpose: analysis.functionalPurpose || [],
        userJourneyStage: analysis.userJourneyStage || '',
        industryRelevance: analysis.industryRelevance || [],
        userTasks: analysis.userTasks || []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Step 4: Save to database
    const id = await saveWebsiteExample(websiteExample);
    
    console.log(`Processing completed for ${imagePath}`);
    return {
      id,
      websiteExample,
      analysis
    };
  } catch (error) {
    console.error(`Error processing screenshot ${imagePath}:`, error);
    throw error;
  }
}

/**
 * Process a directory of screenshots
 * @param {string} directoryPath Path to directory containing screenshots
 * @returns {Promise<Array>} Processing results
 */
async function processDirectory(directoryPath) {
  try {
    console.log(`\n===== Processing directory: ${directoryPath} =====`);
    
    // Get all image files in the directory
    const files = fs.readdirSync(directoryPath)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => path.join(directoryPath, file));
    
    console.log(`Found ${files.length} images in directory`);
    
    if (files.length === 0) {
      console.log('No images found in directory');
      return [];
    }
    
    // Process each image
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`\nProcessing image ${i + 1}/${files.length}: ${file}`);
        
        // Prompt for metadata
        const title = await prompt(`Enter title for ${path.basename(file)} (or press Enter for default): `);
        const description = await prompt('Enter description (or press Enter for default): ');
        const url = await prompt('Enter URL (or press Enter to skip): ');
        const categoryInput = await prompt('Enter categories (comma-separated, or press Enter for default): ');
        const tagsInput = await prompt('Enter tags (comma-separated, or press Enter for default): ');
        
        const metadata = {
          title: title || path.basename(file, path.extname(file)),
          description: description || '',
          url: url || '',
          category: categoryInput ? categoryInput.split(',').map(c => c.trim()) : [],
          tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : [],
          type: 'Screen'
        };
        
        const result = await processScreenshot(file, metadata);
        results.push(result);
        
        // Add a delay between processing to avoid rate limiting
        if (i < files.length - 1) {
          console.log('Waiting before next image...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        // Continue with other images
      }
    }
    
    console.log(`\n===== Completed processing ${results.length}/${files.length} images =====`);
    return results;
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
    throw error;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    console.log('===== Screenshot Analyzer =====');
    console.log('This script will analyze screenshots and save design data to Firebase');
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY environment variable is not set');
      console.error('Please set it before running this script:');
      console.error('export OPENAI_API_KEY=your_api_key_here');
      process.exit(1);
    }
    
    // Ask for mode
    const mode = await prompt('Choose mode:\n1. Analyze a single screenshot\n2. Analyze a directory of screenshots\nEnter choice (1 or 2): ');
    
    if (mode === '1') {
      // Single screenshot mode
      const imagePath = await prompt('Enter path to screenshot: ');
      
      if (!fs.existsSync(imagePath)) {
        console.error(`Error: File ${imagePath} does not exist`);
        process.exit(1);
      }
      
      // Prompt for metadata
      const title = await prompt('Enter title (or press Enter for default): ');
      const description = await prompt('Enter description (or press Enter for default): ');
      const url = await prompt('Enter URL (or press Enter to skip): ');
      const categoryInput = await prompt('Enter categories (comma-separated, or press Enter for default): ');
      const tagsInput = await prompt('Enter tags (comma-separated, or press Enter for default): ');
      
      const metadata = {
        title: title || path.basename(imagePath, path.extname(imagePath)),
        description: description || '',
        url: url || '',
        category: categoryInput ? categoryInput.split(',').map(c => c.trim()) : [],
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : [],
        type: 'Screen'
      };
      
      console.log(`Starting analysis for ${imagePath}...`);
      const result = await processScreenshot(imagePath, metadata);
      
      console.log('\nAnalysis completed successfully!');
      console.log(`Website saved with ID: ${result.id}`);
      
      // Save result to a JSON file for reference
      const outputPath = path.join(__dirname, `../output/screenshot_${result.id}.json`);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Full analysis saved to: ${outputPath}`);
      
    } else if (mode === '2') {
      // Directory mode
      const directoryPath = await prompt('Enter path to directory containing screenshots: ');
      
      if (!fs.existsSync(directoryPath)) {
        console.error(`Error: Directory ${directoryPath} does not exist`);
        process.exit(1);
      }
      
      console.log(`Starting analysis for screenshots in ${directoryPath}...`);
      const results = await processDirectory(directoryPath);
      
      console.log('\nAnalysis completed successfully!');
      console.log(`Analyzed ${results.length} screenshots`);
      
      // Save results to a JSON file for reference
      const outputPath = path.join(__dirname, `../output/screenshots_batch_${Date.now()}.json`);
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
