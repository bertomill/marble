import { openai } from "@ai-sdk/openai";
import { jsonSchema, streamText } from "ai";
import { NextResponse } from 'next/server';

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Validate that OpenAI API key is available in environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { messages, system, tools, webSearch } = await req.json();

    // Determine if we should use search model based on request
    const modelToUse = webSearch?.enabled 
      ? openai("gpt-4o-search-preview") 
      : openai("gpt-4o");
    
    // Prepare options object
    const options: any = {
      model: modelToUse,
      messages,
      system,
      tools: Object.fromEntries(
        Object.entries<{ parameters: unknown }>(tools || {}).map(([name, tool]) => [
          name,
          {
            parameters: jsonSchema(tool.parameters!),
          },
        ]),
      ),
    };

    // Add web search options if enabled
    if (webSearch?.enabled) {
      options.web_search_options = {
        search_context_size: webSearch.contextSize || "medium",
        ...(webSearch.location && {
          user_location: {
            type: "approximate",
            approximate: {
              country: webSearch.location.country || "US",
              city: webSearch.location.city,
              region: webSearch.location.region,
            },
          },
        }),
      };
    }

    const result = streamText(options);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
