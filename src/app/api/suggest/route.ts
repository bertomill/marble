import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the interface for the request body
interface SuggestionRequest {
  context: string;
  userInput?: string;
  lastMessage?: string;
  projectInfo: {
    projectType?: string;
    targetAudience?: string;
    features?: string[];
    designPreferences?: string;
    messageCount?: number;
  };
}

// Define the interface for the response
interface SuggestionResponse {
  suggestions: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SuggestionRequest;
    const { context, userInput, lastMessage, projectInfo } = body;
    
    // Validate API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Default suggestions in case of error
    const defaultSuggestions = {
      projectType: [
        "Business professionals in tech companies",
        "Students and educators",
        "Small business owners and entrepreneurs",
        "General consumers interested in technology"
      ],
      targetAudience: [
        "User authentication and profiles",
        "Real-time collaboration tools",
        "Data analytics and reporting",
        "Mobile-responsive design"
      ],
      features: [
        "Modern and minimalist like Stripe",
        "Professional and enterprise-focused like Slack",
        "Creative and bold like Figma",
        "Clean and intuitive like Notion"
      ],
      designPreferences: [
        "Modern and minimalist like Stripe",
        "Professional and enterprise-focused like Slack",
        "Creative and bold like Figma",
        "Clean and intuitive like Notion"
      ],
      quickReply: [
        "Tell me more",
        "Show me examples",
        "Next step"
      ]
    };

    // Build prompt based on the context
    let systemPrompt = "You are a helpful assistant that generates relevant suggestions for a project planning tool.";
    let userPrompt = "";

    switch (context) {
      case 'projectType':
        systemPrompt += " Generate 4 specific target audience suggestions that would be relevant for this type of project.";
        userPrompt = `The user is creating a ${userInput} project. Generate 4 specific and diverse target audience suggestions that would be relevant for this type of project. Return only the suggestions as a JSON array of strings without explanations or commentary.`;
        break;
      
      case 'targetAudience':
        systemPrompt += " Generate 4 specific feature suggestions that would be valuable for this audience.";
        userPrompt = `The user is creating a ${projectInfo.projectType} project for ${userInput}. Generate 4 specific and diverse feature suggestions that would be valuable for this target audience. Return only the suggestions as a JSON array of strings without explanations or commentary.`;
        break;
      
      case 'features':
        systemPrompt += " Generate 4 specific design style suggestions that would complement these features.";
        userPrompt = `The user is creating a ${projectInfo.projectType} project for ${projectInfo.targetAudience} with features including: ${userInput}. Generate 4 specific and diverse design style suggestions that would complement these features. Each suggestion should reference a well-known site or app style, e.g. "Clean and minimal like Apple". Return only the suggestions as a JSON array of strings without explanations or commentary.`;
        break;
      
      case 'designPreferences':
        systemPrompt += " Generate 4 specific design style suggestions that would complement these features.";
        userPrompt = `The user is creating a ${projectInfo.projectType} project for ${projectInfo.targetAudience} with features including: ${projectInfo.features?.join(', ')}. Generate 4 specific and diverse design style suggestions. Each suggestion should reference a well-known site or app style, e.g. "Clean and minimal like Apple". Return only the suggestions as a JSON array of strings without explanations or commentary.`;
        break;
        
      case 'quickReply':
        systemPrompt += " Generate 3 brief, natural quick reply suggestions that a user might want to respond with at this point in the conversation.";
        userPrompt = `You are helping a user create a ${projectInfo.projectType || 'web'} project${projectInfo.targetAudience ? ' for ' + projectInfo.targetAudience : ''}. 
        
The last message from the AI assistant was: "${lastMessage || ''}"

Based on this point in the conversation, generate 3 brief, natural quick reply options that would be helpful for continuing the conversation. These should be concise (no more than 5 words each) and represent what the user might want to respond with.

Return only the suggestions as a JSON array of strings without explanations or commentary.`;
        break;
      
      default:
        // Return default suggestions if context is not recognized
        return NextResponse.json({
          suggestions: defaultSuggestions[context as keyof typeof defaultSuggestions] || []
        } as SuggestionResponse);
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // Using a smaller, faster model for suggestions
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Extract and parse suggestions from the response
    const responseContent = completion.choices[0].message.content || '';
    let parsedSuggestions: string[] = [];
    
    try {
      const jsonResponse = JSON.parse(responseContent);
      if (Array.isArray(jsonResponse.suggestions)) {
        parsedSuggestions = jsonResponse.suggestions;
      } else if (jsonResponse.suggestions && typeof jsonResponse.suggestions === 'string') {
        // Handle the case where the suggestions might be a string instead of an array
        parsedSuggestions = [jsonResponse.suggestions];
      } else if (jsonResponse.options && Array.isArray(jsonResponse.options)) {
        parsedSuggestions = jsonResponse.options;
      } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
        parsedSuggestions = jsonResponse.results;
      } else {
        // Try to extract any array property from the response
        for (const key in jsonResponse) {
          if (Array.isArray(jsonResponse[key]) && jsonResponse[key].length > 0) {
            parsedSuggestions = jsonResponse[key];
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing suggestions JSON:', error);
      // Fallback to extracting items from a string if JSON parsing fails
      const items = responseContent.match(/"([^"]*)"/g);
      if (items) {
        parsedSuggestions = items.map(item => item.replace(/"/g, ''));
      }
    }

    // Fallback to default suggestions if we couldn't parse any
    if (parsedSuggestions.length === 0) {
      parsedSuggestions = defaultSuggestions[context as keyof typeof defaultSuggestions] || [];
    }

    // Limit to 4 suggestions
    parsedSuggestions = parsedSuggestions.slice(0, 4);
    
    return NextResponse.json({ suggestions: parsedSuggestions } as SuggestionResponse);
  } catch (error) {
    console.error('Suggestion API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: (error as Error).message },
      { status: 500 }
    );
  }
} 