import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the interface for the search result
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  description?: string;
  technologies?: string[];
  relevance?: string;
}

interface SearchResponse {
  results: SearchResult[];
}

export async function POST(request: Request) {
  try {
    const { query, projectType, targetAudience, keyFeatures, designPreferences, projectDescription } = await request.json();
    
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

    // Build a detailed search query that includes all requirements
    const searchQuery = `
      Find 8 high-quality examples of ${projectType} websites or applications for ${targetAudience}.
      Project description: ${projectDescription || 'No description provided'}
      The examples should include these key features: ${keyFeatures.join(', ')}
      Design preferences: ${designPreferences.join(', ')}
      
      For each example, provide:
      1. The name/title of the website
      2. The URL
      3. A description of how it matches the requirements
      4. Technologies used (if you can determine them)
    `;
    
    // Call OpenAI API with web search capabilities
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      web_search_options: {
        search_context_size: "high",
      },
      messages: [
        {
          role: "system",
          content: `You are a web research specialist focusing on finding excellent examples of websites and web applications based on specific requirements. Provide real, active websites with accurate URLs. Format as structured JSON. Focus on relevance to the specified audience and features.`
        },
        {
          role: "user",
          content: searchQuery
        }
      ],
    });

    // Extract and parse suggestions from the response
    const responseContent = completion.choices[0].message.content || '';
    
    // Attempt to parse JSON first
    let results: SearchResult[] = [];
    try {
      // Check if the response contains JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedData)) {
            results = parsedData;
          } else if (parsedData.results && Array.isArray(parsedData.results)) {
            results = parsedData.results;
          } else if (parsedData.examples && Array.isArray(parsedData.examples)) {
            results = parsedData.examples;
          } else {
            // Look for any array property that might contain results
            const arrayProps = Object.keys(parsedData).filter(key => 
              Array.isArray(parsedData[key]) && parsedData[key].length > 0
            );
            
            if (arrayProps.length > 0) {
              results = parsedData[arrayProps[0]];
            }
          }
        } catch {
          // Silently catch and continue with structured text extraction
          console.log('JSON parsing failed, will attempt structured text extraction');
        }
      }
      
      // If no results from JSON parsing, try structured text extraction
      if (results.length === 0) {
        results = extractStructuredResults(responseContent);
      }
    } catch (error) {
      console.error('Failed to parse response:', error);
      // Fallback to structured text extraction
      results = extractStructuredResults(responseContent);
    }
    
    // Clean up any malformed result data
    const cleanResults = results.map(result => ({
      title: cleanJsonString(result.title || ''),
      url: cleanJsonString(result.url || '#'),
      snippet: cleanJsonString(result.description || result.snippet || ''),
      technologies: result.technologies || [],
      relevance: result.relevance || ''
    }));

    return NextResponse.json({ results: cleanResults } as SearchResponse);
  } catch (error) {
    console.error('Website research API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform website research', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to clean JSON string values
const cleanJsonString = (str: string): string => {
  if (!str) return '';
  return str.replace(/\\"/g, '"')
            .replace(/^"(.+)"$/, '$1')
            .replace(/\\n/g, ' ')
            .replace(/["']\s*url\s*["']\s*:\s*["']/g, '')
            .replace(/["']$/g, '')
            .trim();
};

// Function to extract structured results from text
function extractStructuredResults(text: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Try to find examples with clear headers using various patterns
  
  // Pattern 1: Numbered examples with title and URL
  const pattern1 = /(\d+)[\.\)]\s+([^\n]+?)\s*(?:[-–—]\s*)?(?:URL|Link|Website)?:?\s*(https?:\/\/[^\s\n]+)(?:[^\n]*Description:?\s*([^\n]+))?/gi;
  let match;
  
  while ((match = pattern1.exec(text)) !== null) {
    results.push({
      title: match[2].trim(),
      url: match[3].trim(),
      snippet: match[4] ? match[4].trim() : ''
    });
  }
  
  // Pattern 2: Site names with URL on separate line
  if (results.length === 0) {
    const siteBlocks = text.split(/\n\s*\n/);
    
    for (const block of siteBlocks) {
      const titleMatch = block.match(/(?:\d+[\.\)]\s+)?([^\n]+)/);
      const urlMatch = block.match(/(?:URL|Link|Website)?:?\s*(https?:\/\/[^\s\n]+)/i);
      
      if (titleMatch && urlMatch) {
        const descriptionMatch = block.match(/(?:Description|About):\s*([^\n]+)/i) || 
                                 block.replace(titleMatch[0], '').replace(urlMatch[0], '').match(/([^\n]+)/);
        
        // Look for technologies
        const techMatch = block.match(/(?:Technologies|Tech Stack|Built with|Uses):\s*([^\n]+)/i);
        
        results.push({
          title: titleMatch[1].trim(),
          url: urlMatch[1].trim(),
          snippet: descriptionMatch ? descriptionMatch[1].trim() : '',
          technologies: techMatch ? techMatch[1].split(/,\s*/).map(t => t.trim()) : undefined
        });
      }
    }
  }
  
  // Pattern 3: Look for URL patterns and extract surrounding context
  if (results.length === 0) {
    const urlPattern = /(https?:\/\/[^\s\n]+)/g;
    let urlMatch;
    
    while ((urlMatch = urlPattern.exec(text)) !== null) {
      const url = urlMatch[1];
      const startPos = Math.max(0, urlMatch.index - 100);
      const endPos = Math.min(text.length, urlMatch.index + url.length + 100);
      const context = text.substring(startPos, endPos);
      
      // Try to find title before URL
      const titleBefore = context.substring(0, urlMatch.index - startPos).match(/(?:\d+[\.\)]|\*)?\s*([^\n\d][^\n]+)$/);
      // Try to find description after URL
      const descAfter = context.substring(urlMatch.index - startPos + url.length).match(/^([^\n]+)/);
      
      results.push({
        title: titleBefore ? titleBefore[1].trim() : `Example ${results.length + 1}`,
        url: url,
        snippet: descAfter ? descAfter[1].trim() : ''
      });
    }
  }
  
  return results;
} 