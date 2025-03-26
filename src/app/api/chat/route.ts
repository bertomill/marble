import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Message } from '../../../types/chat';

export const maxDuration = 30;

// GET endpoint for initial greeting message
export async function GET() {
  const greeting = {
    role: 'assistant',
    content: "Hi there! I'm your SiteStack assistant. I'd love to help you create your perfect website. Could you tell me a bit about your business or project?"
  };
  
  return new Response(JSON.stringify({ message: greeting }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Main chat endpoint that processes messages
export async function POST(req: Request) {
  // Check if a valid API key is configured
  if (!process.env.OPENAI_API_KEY || 
      (process.env.OPENAI_API_KEY.includes('your-actual-openai-api-key') && 
       !process.env.OPENAI_API_KEY.startsWith('sk-'))) {
    console.warn('Missing or invalid OpenAI API key. Please set a valid key in .env.local');
    return new Response(JSON.stringify({
      error: 'OpenAI API key is not configured. Please update your .env.local file with a valid API key.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, userInfo } = await req.json();
  
  // Add system message with instructions
  const systemMessage = {
    role: 'system',
    content: `You are a professional website design consultant for SiteStack, a website building platform.
    Your goal is to gather 5 key facts about the user's business or project in a conversational way.
    
    Focus on collecting exactly 5 personalized, important facts that will help design their website effectively.
    These facts should be tailored to their specific business needs - don't use a standardized set of questions.
    
    Ask focused questions one at a time, listen carefully to their answers, and stay on track.
    Be conversational, friendly, and professional - like an expert consultant guiding them through the process.
    
    If you detect specific information that should be saved as one of the 5 key facts, include it in your response.
    
    Current user info: ${userInfo ? JSON.stringify(userInfo) : '{}'}`
  };
  
  // Add system message and format other messages correctly
  const formattedMessages = [
    systemMessage,
    ...messages.map((msg: Message) => ({
      role: msg.type === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))
  ];
  
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: formattedMessages,
  });
  
  return result.toDataStreamResponse();
} 