import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the interface for the web search result
interface WebSearchResult {
  title: string;
  description: string;
  url: string;
}

interface WebSearchResponse {
  results: WebSearchResult[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Validate OpenAI API key
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
    
    // Use OpenAI's official web search model
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview", // Use the web search specific model
      web_search_options: {
        search_context_size: "high", // Get comprehensive results for better matches
      },
      messages: [
        {
          role: "system",
          content: "You are a web design assistant helping to find example websites that match specific design criteria. Provide detailed, structured information about relevant websites."
        },
        {
          role: "user",
          content: `Search for examples of ${query}. Please return 3-5 of the most impressive and relevant websites that match this description. For each website, include the name, URL, and a detailed description of what makes it special or interesting.`
        }
      ],
      max_tokens: 1500,
    });
    
    // Extract the response and any citations/annotations
    const responseContent = completion.choices[0].message.content || '';
    const annotations = completion.choices[0].message.annotations || [];
    
    // Process the response to extract website information
    // We'll use regex to find website mentions and URLs
    const websiteRegex = /(?:\*\*|##)?\s*([\w\s&'.,-]+)(?:\*\*|##)?\s*(?:-|\:)?\s*(https?:\/\/[^\s)]+)/gi;
    let match;
    const extractedSites: WebSearchResult[] = [];
    
    // Parse the response text for websites and URLs
    while ((match = websiteRegex.exec(responseContent)) !== null) {
      const title = match[1].trim();
      const url = match[2].trim();
      
      // Find the description - look for text between this match and the next match or end
      const currentPos = match.index + match[0].length;
      const nextMatchPos = websiteRegex.lastIndex;
      
      // Extract the description text between this match and the next one
      let description = responseContent.substring(currentPos, nextMatchPos > 0 ? nextMatchPos : undefined)
        .trim()
        .replace(/^[:\s-]+/, '') // Remove leading colons, spaces, dashes
        .split('\n\n')[0]; // Take just the first paragraph
      
      if (!description && annotations.length > 0) {
        // Try to find a description from annotations
        for (const annotation of annotations) {
          if (annotation.type === 'url_citation' && 
              annotation.url_citation?.url === url &&
              annotation.url_citation?.title) {
            description = annotation.url_citation.title;
            break;
          }
        }
      }
      
      // If still no description, use a generic one
      if (!description) {
        description = `Example of ${query}`;
      }
      
      // Add to our results if we have both title and URL
      if (title && url) {
        extractedSites.push({
          title,
          url,
          description
        });
      }
    }
    
    // If we couldn't extract structured data, create a more generic extraction
    if (extractedSites.length === 0) {
      // Extract all URLs from the text
      const urlRegex = /(https?:\/\/[^\s)"]+)/g;
      const urls = responseContent.match(urlRegex) || [];
      
      // For each URL, create a basic result
      for (const url of urls) {
        // Try to extract a title before or after the URL
        const titleRegex = new RegExp(`((?:\\*\\*|##)?[\\w\\s&'.,:-]+(?:\\*\\*|##)?)(?:\\s*[-:]\\s*)?${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*[-:]\\s*)?((?:\\*\\*|##)?[\\w\\s&'.,:-]+(?:\\*\\*|##)?)`, 'i');
        const titleMatch = responseContent.match(titleRegex);
        
        let title = '';
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/\*\*|##/g, '').trim();
        } else if (titleMatch && titleMatch[2]) {
          title = titleMatch[2].replace(/\*\*|##/g, '').trim();
        }
        
        // If no title found, create one from the URL
        if (!title) {
          // Extract domain name for the title
          const urlObj = new URL(url);
          title = urlObj.hostname.replace(/^www\./, '').split('.')[0];
          // Capitalize first letter
          title = title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        // Add to our results
        extractedSites.push({
          title,
          url,
          description: `Example of ${query} found during web search.`
        });
      }
    }
    
    // If we still don't have results, fall back to the fallback results
    if (extractedSites.length === 0) {
      return NextResponse.json({ 
        results: getFallbackResults(query) 
      } as WebSearchResponse);
    }
    
    return NextResponse.json({ 
      results: extractedSites 
    } as WebSearchResponse);
    
  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Function to get fallback results in case the API fails
function getFallbackResults(query: string): WebSearchResult[] {
  // Mock results based on query type
  const mockResults = {
    ecommerce: [
      {
        title: "Shopify - Best-in-class eCommerce platform",
        description: "Shopify is a complete commerce platform that lets you start, grow, and manage a business.",
        url: "https://www.shopify.com/"
      },
      {
        title: "Etsy - Shop for handmade, vintage, custom, and unique gifts",
        description: "Find the perfect handmade gift, vintage & on-trend clothes, unique jewelry, and more.",
        url: "https://www.etsy.com/"
      },
      {
        title: "Amazon - Online shopping for electronics, apparel, and more",
        description: "Amazon.com: Online Shopping for Electronics, Apparel, Computers, Books, DVDs & more.",
        url: "https://www.amazon.com/"
      }
    ],
    portfolio: [
      {
        title: "Behance - Showcase & Discover Creative Work",
        description: "Behance is the world's largest creative network for showcasing and discovering creative work.",
        url: "https://www.behance.net/"
      },
      {
        title: "Dribbble - Discover the world's top designers & creatives",
        description: "Dribbble is where designers gain inspiration, feedback, community, and jobs.",
        url: "https://dribbble.com/"
      },
      {
        title: "Adobe Portfolio - Build your own personalized website",
        description: "Create a beautiful portfolio website with Adobe Portfolio. Free with Creative Cloud.",
        url: "https://portfolio.adobe.com/"
      }
    ],
    blog: [
      {
        title: "WordPress.com - Create a Free Website or Blog",
        description: "Create a free website or blog at WordPress.com. Choose from hundreds of customizable themes.",
        url: "https://wordpress.com/"
      },
      {
        title: "Medium - Where good ideas find you",
        description: "Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing.",
        url: "https://medium.com/"
      },
      {
        title: "Ghost - The professional publishing platform",
        description: "Ghost is a powerful app for new-media creators to publish, share, and grow a business around their content.",
        url: "https://ghost.org/"
      }
    ]
  };
    
  // Determine which type of results to return
  let resultType = "ecommerce";
  const lowercaseQuery = query.toLowerCase();
    
  if (lowercaseQuery.includes("portfolio") || lowercaseQuery.includes("showcase") || 
      lowercaseQuery.includes("design") || lowercaseQuery.includes("creative")) {
    resultType = "portfolio";
  } else if (lowercaseQuery.includes("blog") || lowercaseQuery.includes("content") || 
            lowercaseQuery.includes("article") || lowercaseQuery.includes("writing")) {
    resultType = "blog";
  }
    
  // Add more specific examples based on query keywords
  const results = [...mockResults[resultType as keyof typeof mockResults]];
    
  // For jewelry e-commerce specifically
  if (lowercaseQuery.includes("jewelry") && resultType === "ecommerce") {
    results.unshift({
      title: "Blue Nile - Jewelry & Engagement Rings",
      description: "Shop the world's most beautiful diamonds and fine jewelry. Create your own engagement ring with a loose diamond and ring setting of your choice.",
      url: "https://www.bluenile.com/"
    });
    results.unshift({
      title: "Mejuri - Fine Jewelry, Everyday",
      description: "Handcrafted fine jewelry designed to be worn every day. Shop gold necklaces, rings, bracelets, earrings and more.",
      url: "https://mejuri.com/"
    });
  }
  
  return results;
} 