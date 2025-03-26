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
  componentType: string;
  tags: string[];
}

interface Analysis {
  components?: Component[];
  suggestedTags?: string[];
  colors?: string[];
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

    console.log('Calling OpenAI Vision API...');
    
    // Call OpenAI Vision API with the new responses API format
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { 
              type: "input_text", 
              text: "Analyze this website screenshot and provide the following information in JSON format:\n" +
                    "1. List of UI components with their type, description, and relevant tags\n" +
                    "2. Overall website style tags\n" +
                    "3. Main colors used in the design (hex codes)\n\n" +
                    "Format the response as a JSON object with these keys:\n" +
                    "{\n" +
                    "  components: [{ id: string, name: string, description: string, componentType: string, tags: string[] }],\n" +
                    "  suggestedTags: string[],\n" +
                    "  colors: string[]\n" +
                    "}"
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
              detail: "high"
            }
          ]
        }
      ]
    });

    console.log('Received response from OpenAI');

    // Get the response text
    const responseContent = response.output_text;
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
      analysis = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed analysis:', analysis);
    } catch (error) {
      console.error('Failed to parse JSON:', responseContent);
      console.error('Parse error:', error);
      throw new Error('Invalid JSON response');
    }

    // Ensure the analysis has the required structure
    const validatedAnalysis = {
      components: analysis.components?.map((comp: Component) => ({
        id: comp.id || `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: comp.name || 'Unknown Component',
        description: comp.description || '',
        componentType: comp.componentType || 'Other',
        tags: Array.isArray(comp.tags) ? comp.tags : [],
      })) || [],
      suggestedTags: Array.isArray(analysis.suggestedTags) ? analysis.suggestedTags : [],
      colors: Array.isArray(analysis.colors) ? analysis.colors : [],
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