import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { collection, getDocs, query, limit as firestoreLimit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the interface for the search result
interface SearchResult {
  id: string;
  imageUrl: string;
  siteName: string;
  description?: string;
  altText?: string;
  category?: string;
  tags?: string[];
  score?: number;
  url?: string; // For backward compatibility
  title?: string; // For backward compatibility
  snippet?: string; // For backward compatibility
}

interface Ranking {
  id: string;
  score: number;
}

export async function POST(request: Request) {
  try {
    const { query: searchQuery, limit = 10 } = await request.json();
    
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

    // For large databases, we don't want to fetch all 10,000 screenshots
    // Instead, fetch a reasonable batch (200 most recent) to analyze
    const screenshotsRef = collection(db, 'screenshots');
    const screenshotsQuery = query(
      screenshotsRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(200)
    );
    
    const querySnapshot = await getDocs(screenshotsQuery);
    
    // Convert to array of screenshots
    const screenshots = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SearchResult[];

    // If no screenshots, return empty results
    if (screenshots.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Prepare data for OpenAI to analyze - only send the necessary fields to reduce token usage
    const screenshotData = screenshots.map(s => ({
      id: s.id,
      siteName: s.siteName || s.title || '',
      description: s.description || s.altText || s.snippet || '',
      category: s.category || '',
      tags: s.tags || [],
    }));

    // Use OpenAI to analyze and rank the screenshots
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that helps find relevant UI/UX design screenshots based on user queries. 
          You'll be given a list of screenshots with their metadata and a user's search query. 
          Your job is to analyze which screenshots are most relevant to the query and rank them.
          Return ONLY valid JSON with an array under the key "rankings" containing objects with "id" and "score" properties (score from 0-1).`
        },
        {
          role: "user",
          content: `Find the most relevant screenshots for this query: "${searchQuery}"\n\nHere are the screenshots:\n${JSON.stringify(screenshotData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    // Parse the AI's response
    const responseContent = completion.choices[0].message.content || '';
    let aiResponse;
    
    try {
      aiResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // If parsing fails, just return the screenshots without AI ranking
      return NextResponse.json({ 
        results: screenshots.slice(0, limit) 
      });
    }

    // Get the rankings from the AI response
    const rankings = aiResponse.rankings || aiResponse.results || [];
    
    // Map the rankings to the actual screenshots
    const rankedResults = rankings
      .filter((r: Ranking) => r.id && r.score !== undefined)
      .map((ranking: Ranking) => {
        const screenshot = screenshots.find(s => s.id === ranking.id);
        if (screenshot) {
          return {
            ...screenshot,
            score: ranking.score
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, limit);

    // If AI ranking failed, fall back to the original screenshots
    if (rankedResults.length === 0) {
      return NextResponse.json({ 
        results: screenshots.slice(0, limit) 
      });
    }

    return NextResponse.json({ results: rankedResults });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: (error as Error).message },
      { status: 500 }
    );
  }
} 