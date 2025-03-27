import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected types
interface Component {
  id?: string;
  name: string;
  description: string;
  purpose?: string;
  componentType: string;
  tags: string[];
}

interface Typography {
  fontFamilies?: string[];
  fontSizes?: string[];
  fontWeights?: string[];
  headingStyles?: string[];
  bodyStyles?: string[];
}

interface Layout {
  gridSystem?: string;
  spacing?: string;
  alignment?: string;
  responsiveApproach?: string;
}

interface Analysis {
  components?: Component[];
  suggestedTags?: string[];
  colorPalette?: string[];
  typography?: Typography;
  layout?: Layout;
  designStyle?: string[];
  designPatterns?: string[];
  accessibilityNotes?: string;
  functionalPurpose?: string[];
  userJourneyStage?: string;
  industryRelevance?: string[];
  userTasks?: string[];
}

export async function POST(request: Request) {
  try {
    // Log the start of processing
    console.log('Starting screenshot analysis...');

    const body = await request.json();
    console.log('Request body received:', { hasImage: !!body.image });

    const { image } = body;

    if (!image) {
      console.error('No image data provided in request');
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Calling OpenAI API...');
    
    // Model selection - use a more cost-effective model
    const model = process.env.USE_CHEAPER_MODEL === 'true' ? 'gpt-4o-mini' : 'gpt-4o';
    console.log(`Using model: ${model}`);
    
    // Call OpenAI API with the chat completions format
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this website screenshot and provide a detailed UI design analysis in JSON format. Include the following information:\n\n" +
                    "1. UI Components: List all visible UI components with their name, description, purpose, type, and relevant tags\n" +
                    "2. Color Palette: Extract the main colors used (with hex codes if possible)\n" +
                    "3. Typography: Identify font families, sizes, weights, and styles for headings and body text\n" +
                    "4. Layout Patterns: Describe the grid system, spacing, alignment, and responsive approach\n" +
                    "5. Design Style: Categorize the overall design style (e.g., minimalist, skeuomorphic, flat, material)\n" +
                    "6. Design Patterns: Identify common UI/UX design patterns used\n" +
                    "7. Accessibility Notes: Comment on color contrast, text readability, and other accessibility aspects\n" +
                    "8. Functional Purpose: What is this interface designed to help users accomplish? List the main functional purposes\n" +
                    "9. User Journey Stage: Which stage of the user journey does this interface represent? (e.g., onboarding, checkout, settings)\n" +
                    "10. Industry Relevance: Which industries would this design be most appropriate for?\n" +
                    "11. User Tasks: What specific user tasks does this interface support?\n\n" +
                    "Format your response as a valid JSON object with these keys:\n" +
                    "{\n" +
                    "  \"components\": [{ \"name\": string, \"description\": string, \"purpose\": string, \"componentType\": string, \"tags\": string[] }],\n" +
                    "  \"colorPalette\": string[],\n" +
                    "  \"typography\": { \"fontFamilies\": string[], \"fontSizes\": string[], \"fontWeights\": string[], \"headingStyles\": string[], \"bodyStyles\": string[] },\n" +
                    "  \"layout\": { \"gridSystem\": string, \"spacing\": string, \"alignment\": string, \"responsiveApproach\": string },\n" +
                    "  \"designStyle\": string[],\n" +
                    "  \"designPatterns\": string[],\n" +
                    "  \"accessibilityNotes\": string,\n" +
                    "  \"functionalPurpose\": string[],\n" +
                    "  \"userJourneyStage\": string,\n" +
                    "  \"industryRelevance\": string[],\n" +
                    "  \"userTasks\": string[],\n" +
                    "  \"suggestedTags\": string[]\n" +
                    "}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    console.log('Received response from OpenAI');

    // Get the response text
    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('No content in OpenAI response');
      throw new Error('No analysis results received');
    }

    // Extract JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseContent);
      throw new Error('Invalid response format');
    }

    let analysis: Analysis;
    try {
      // Clean up the JSON string to remove any comments or invalid syntax
      let jsonString = jsonMatch[0];
      
      // Remove JavaScript-style comments (both // and /* */)
      jsonString = jsonString.replace(/\/\/.*?(\n|$)/g, '');
      jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Remove trailing commas in arrays and objects
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      
      // Handle any other potential issues
      jsonString = jsonString.replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":'); // Ensure property names are quoted
      
      console.log('Cleaned JSON string:', jsonString);
      analysis = JSON.parse(jsonString);
      console.log('Successfully parsed analysis:', analysis);
    } catch (error) {
      console.error('Failed to parse JSON:', responseContent);
      console.error('Parse error:', error);
      
      // Fallback: Try to extract a valid JSON subset using a more aggressive approach
      try {
        console.log('Attempting fallback JSON extraction...');
        const fallbackJson = extractValidJson(responseContent);
        if (fallbackJson) {
          analysis = fallbackJson;
          console.log('Successfully parsed analysis using fallback method:', analysis);
        } else {
          throw new Error('Could not extract valid JSON even with fallback method');
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        throw new Error('Invalid JSON response');
      }
    }
    
    // Helper function to try to extract valid JSON from a string
    function extractValidJson(str: string): any {
      // Try to find anything that looks like a JSON object
      const possibleJsonMatches = str.match(/(\{[\s\S]*?\})/g);
      if (!possibleJsonMatches) return null;
      
      // Try each match until we find one that parses
      for (const match of possibleJsonMatches) {
        try {
          return JSON.parse(match);
        } catch (e) {
          // Try to clean this match
          try {
            let cleaned = match
              .replace(/\/\/.*?(\n|$)/g, '')
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .replace(/,\s*([}\]])/g, '$1')
              .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
            
            return JSON.parse(cleaned);
          } catch (e2) {
            // Continue to the next match
            continue;
          }
        }
      }
      
      return null;
    }

    // Ensure the analysis has the required structure
    const validatedAnalysis = {
      components: analysis.components?.map((comp: Component) => ({
        id: comp.id || `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: comp.name || 'Unknown Component',
        description: comp.description || '',
        purpose: comp.purpose || '',
        componentType: comp.componentType || 'Other',
        tags: Array.isArray(comp.tags) ? comp.tags : [],
      })) || [],
      suggestedTags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags : [],
      colorPalette: Array.isArray(analysis.colorPalette) ? analysis.colorPalette : [],
      typography: analysis.typography || {
        fontFamilies: [],
        fontSizes: [],
        fontWeights: [],
        headingStyles: [],
        bodyStyles: []
      },
      layout: analysis.layout || {
        gridSystem: '',
        spacing: '',
        alignment: '',
        responsiveApproach: ''
      },
      designStyle: Array.isArray(analysis.designStyle) ? analysis.designStyle : [],
      designPatterns: Array.isArray(analysis.designPatterns) ? analysis.designPatterns : [],
      accessibilityNotes: analysis.accessibilityNotes || '',
      functionalPurpose: Array.isArray(analysis.functionalPurpose) ? analysis.functionalPurpose : [],
      userJourneyStage: analysis.userJourneyStage || '',
      industryRelevance: Array.isArray(analysis.industryRelevance) ? analysis.industryRelevance : [],
      userTasks: Array.isArray(analysis.userTasks) ? analysis.userTasks : []
    };

    console.log('Analysis completed successfully');
    return NextResponse.json(validatedAnalysis);
  } catch (error) {
    // Log the full error details
    console.error('Error analyzing screenshot:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to analyze screenshot', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}