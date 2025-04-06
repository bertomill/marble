import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Screenshot {
  id: string;
  imageUrl: string;
  siteName: string;
  description?: string;
  altText?: string;
  category?: string;
  tags?: string[];
}

interface SearchParams {
  keywords: string[];
  projectType?: string;
  designPreferences?: string;
  limit?: number;
}

export async function POST(request: Request) {
  try {
    const { keywords, projectType, designPreferences, limit = 6 } = await request.json() as SearchParams;
    
    // Get screenshots from Firebase
    const screenshotsRef = collection(db, 'screenshots');
    
    // Query based on category if projectType is provided
    let screenshotQuery;
    
    if (projectType) {
      screenshotQuery = query(
        screenshotsRef,
        where('category', '==', projectType.toLowerCase()),
        orderBy('createdAt', 'desc'),
        firestoreLimit(20)
      );
    } else {
      // Otherwise, just get the most recent screenshots
      screenshotQuery = query(
        screenshotsRef,
        orderBy('createdAt', 'desc'),
        firestoreLimit(20)
      );
    }
    
    const querySnapshot = await getDocs(screenshotQuery);
    
    // Convert to array of screenshots
    const screenshots = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Screenshot[];
    
    // Calculate relevance score for each screenshot based on keyword matches
    const scoredScreenshots = screenshots.map(screenshot => {
      let score = 0;
      
      // Check tags for keyword matches
      keywords.forEach(keyword => {
        const lowercaseKeyword = keyword.toLowerCase();
        
        // Match against tags (higher weight)
        if (screenshot.tags) {
          screenshot.tags.forEach(tag => {
            if (tag.toLowerCase().includes(lowercaseKeyword)) {
              score += 3;
            }
          });
        }
        
        // Match against title and description (medium weight)
        if ((screenshot.siteName || '').toLowerCase().includes(lowercaseKeyword)) {
          score += 2;
        }
        
        if ((screenshot.description || '').toLowerCase().includes(lowercaseKeyword)) {
          score += 1;
        }
        
        // Match against category (highest weight)
        if ((screenshot.category || '').toLowerCase().includes(lowercaseKeyword)) {
          score += 5;
        }
      });
      
      // Boost scores based on design preferences match
      if (designPreferences && screenshot.tags) {
        const designKeywords = designPreferences.toLowerCase().split(/\s+/);
        designKeywords.forEach(keyword => {
          if (screenshot.tags?.some(tag => tag.toLowerCase().includes(keyword))) {
            score += 2;
          }
        });
      }
      
      return { ...screenshot, relevanceScore: score };
    });
    
    // Sort by relevance score and limit results
    const sortedScreenshots = scoredScreenshots
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
    
    // Remove the relevance score before returning
    const results = sortedScreenshots.map(({ relevanceScore, ...rest }) => rest);
    
    return NextResponse.json({ screenshots: results });
  } catch (error) {
    console.error('Screenshot search error:', error);
    return NextResponse.json(
      { error: 'Failed to search screenshots', details: (error as Error).message },
      { status: 500 }
    );
  }
} 