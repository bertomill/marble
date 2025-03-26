import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Message } from '../../../../types/chat';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Next question endpoint that analyzes the conversation and determines the next question to ask
export async function POST(request: Request) {
  try {
    // Check if a valid API key is configured
    if (!process.env.OPENAI_API_KEY || 
        (process.env.OPENAI_API_KEY.includes('your-actual-openai-api-key') && 
         !process.env.OPENAI_API_KEY.startsWith('sk-'))) {
      console.warn('Missing or invalid OpenAI API key. Please set a valid key in .env.local');
      return NextResponse.json({
        message: "Could you tell me more about your website needs?",
        options: ["I need an e-commerce store", "I need a portfolio website", "I need a business website"]
      });
    }

    const { conversation, currentInfo } = await request.json();
    
    // Prepare the conversation history for OpenAI
    const conversationHistory = conversation.map((msg: Message) => ({
      role: msg.type === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add system message with instructions
    const systemMessage = {
      role: 'system',
      content: `You are a professional website design consultant for SiteStack, a website building platform.
      Your goal is to analyze the conversation so far and determine if you've collected 5 key facts about the user's business or project.
      
      Based on what we know so far: ${JSON.stringify(currentInfo)},
      determine which key facts we've already collected and what's still needed. Prioritize quality over quantity.
      
      These 5 facts should be personalized and important for website design. Examples might include:
      - The nature of their business or project (what they do/sell)
      - Their target audience or customer base
      - Their key differentiators or unique selling points
      - Their aesthetic preferences or design style
      - Their website goals or functionality needs
      - Special features they require
      
      However, don't limit yourself to these examples. Adapt to what's most relevant for THIS specific user.
      
      Format your response in JSON as follows:
      {
        "message": "Your next question text here, focusing on a missing key fact",
        "options": ["Optional suggestion 1", "Optional suggestion 2"], // include only if appropriate
        "suggestedInfo": { 
          // Include key facts you've detected from the conversation
          // Use descriptive keys that reflect the type of information, not generic labels
          // Example: "businessNature": "handcrafted jewelry boutique specializing in silver"
        },
        "completionStatus": {
          "factsCollected": 0-5, // number of key facts collected so far
          "isComplete": false, // set to true when we have 5 good quality facts
          "missingFactTypes": ["description of missing fact types"]
        }
      }
      
      Important: Your response must be valid JSON that can be parsed. Nothing else.`
    };

    // Make the OpenAI chat completion request
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [systemMessage, ...conversationHistory],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    // Get the assistant's response
    const assistantResponse = chatCompletion.choices[0].message.content;
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(assistantResponse || '{}');
      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json({
        message: "Could you tell me more about your website needs?",
        options: ["I need an e-commerce store", "I need a portfolio website", "I need a business website"]
      });
    }
  } catch (error) {
    console.error('Error in next-question API:', error);
    return NextResponse.json(
      { error: 'Failed to determine next question' },
      { status: 500 }
    );
  }
} 