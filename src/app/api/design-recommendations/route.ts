import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import OpenAI from 'openai';
import { db } from '@/lib/firebase';

// Define interface for screenshot data
interface Screenshot {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  style?: string;
  colors?: string[];
  source?: string;
}

interface DesignRecommendationParams {
  projectType: string;
  targetAudience: string;
  keyFeatures: string[];
  designPreferences: string[];
  selectedWebsites: Array<{
    title: string;
    url: string;
    description: string;
    technologies?: string[];
  }>;
}

export async function POST(request: Request) {
  try {
    const {
      projectType,
      targetAudience,
      keyFeatures,
      designPreferences,
      selectedWebsites
    } = await request.json() as DesignRecommendationParams;
    
    // Early return if no selected websites
    if (!selectedWebsites || selectedWebsites.length === 0) {
      return NextResponse.json({ 
        error: "No websites selected for reference",
        screenshots: [] 
      }, { status: 400 });
    }

    // Extract design keywords using AI to analyze selected websites
    const designKeywords = await extractDesignKeywords(
      projectType,
      targetAudience,
      keyFeatures,
      designPreferences,
      selectedWebsites
    );
    
    // Query Firebase for design screenshots using the keywords
    const screenshots = await findMatchingScreenshots(designKeywords, projectType);
    
    // Group screenshots by category for better organization
    const groupedScreenshots = groupScreenshotsByCategory(screenshots);
    
    return NextResponse.json({ 
      screenshots,
      groupedScreenshots,
      designKeywords
    });
    
  } catch (error) {
    console.error('Design recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate design recommendations', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Use AI to extract design keywords from selected websites
async function extractDesignKeywords(
  projectType: string,
  targetAudience: string,
  keyFeatures: string[],
  designPreferences: string[],
  selectedWebsites: Array<any>
): Promise<string[]> {
  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    // Create a prompt that asks for design keywords based on selected websites
    const prompt = `
    Analyze these selected websites for a ${projectType} project targeting ${targetAudience}:
    ${selectedWebsites.map(site => `- ${site.title}: ${site.description}`).join('\n')}
    
    Key features needed: ${keyFeatures.join(', ')}
    Design preferences: ${designPreferences.join(', ')}
    
    Extract 10-15 specific design keywords that capture the visual style, UI patterns, and design elements
    that would be valuable for this project. Focus on visual and UI/UX aspects only.
    
    Return only the keywords as a comma-separated list.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a design system expert that extracts design keywords from website descriptions. Focus only on visual elements, UI patterns, and design systems."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });
    
    // Extract keywords from the response
    const keywordText = response.choices[0].message.content || '';
    const keywords = keywordText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    return keywords;
  } catch (error) {
    console.error('Error extracting design keywords:', error);
    // Fallback to basic keywords if AI fails
    return [
      ...designPreferences,
      'modern',
      'clean',
      'responsive',
      projectType.toLowerCase()
    ];
  }
}

// Query Firebase for matching screenshots
async function findMatchingScreenshots(keywords: string[], projectType: string): Promise<Screenshot[]> {
  try {
    // Reference to the screenshots collection
    const screenshotsRef = collection(db, 'screenshots');
    
    // First try to find exact category matches
    let screenshotQuery = query(
      screenshotsRef,
      where('category', '==', projectType.toLowerCase()),
      limit(6)
    );
    
    let querySnapshot = await getDocs(screenshotQuery);
    let screenshots: Screenshot[] = [];
    
    // If we found category matches, use those
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        screenshots.push({ id: doc.id, ...doc.data() } as Screenshot);
      });
    } 
    
    // If we don't have enough, search by tags
    if (screenshots.length < 6) {
      // Combine different queries for each keyword
      const keywordPromises = keywords.map(async keyword => {
        const keywordQuery = query(
          screenshotsRef,
          where('tags', 'array-contains', keyword.toLowerCase()),
          limit(3)
        );
        
        const keywordSnapshot = await getDocs(keywordQuery);
        return keywordSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Screenshot));
      });
      
      const keywordResults = await Promise.all(keywordPromises);
      
      // Flatten and deduplicate
      const additionalScreenshots = Array.from(
        new Map(
          keywordResults.flat().map(item => [item.id, item])
        ).values()
      );
      
      // Add new screenshots, avoiding duplicates
      additionalScreenshots.forEach(screenshot => {
        if (!screenshots.some(s => s.id === screenshot.id)) {
          screenshots.push(screenshot);
        }
      });
    }
    
    // Limit to 12 screenshots
    return screenshots.slice(0, 12);
  } catch (error) {
    console.error('Error querying screenshots:', error);
    // Use mock screenshots if Firebase fails
    return getMockScreenshots(keywords, projectType);
  }
}

// Group screenshots by category
function groupScreenshotsByCategory(screenshots: Screenshot[]): Record<string, Screenshot[]> {
  const grouped: Record<string, Screenshot[]> = {};
  
  screenshots.forEach(screenshot => {
    if (!grouped[screenshot.category]) {
      grouped[screenshot.category] = [];
    }
    grouped[screenshot.category].push(screenshot);
  });
  
  return grouped;
}

// Fallback function that returns mock data if Firebase query fails
function getMockScreenshots(keywords: string[], projectType: string): Screenshot[] {
  // Mock screenshots database with diverse examples
  const screenshotsDatabase = [
    {
      id: "screen1",
      url: "/screenshots/dashboard-analytics.jpg",
      title: "Analytics Dashboard",
      description: "Modern dashboard with key metrics and colorful charts",
      category: "dashboard",
      tags: ["analytics", "charts", "dashboard", "admin", "data visualization", "modern"]
    },
    {
      id: "screen2",
      url: "/screenshots/profile-minimal.jpg",
      title: "User Profile",
      description: "Clean user profile with avatar, stats and activity feed",
      category: "profile",
      tags: ["profile", "user", "avatar", "stats", "activity", "minimal"]
    },
    {
      id: "screen3",
      url: "/screenshots/landing-gradient.jpg",
      title: "Landing Hero",
      description: "Bold landing page with gradient background and call-to-action",
      category: "marketing",
      tags: ["landing", "hero", "gradient", "cta", "marketing", "bold"]
    },
    {
      id: "screen4",
      url: "/screenshots/onboarding-steps.jpg",
      title: "Onboarding Flow",
      description: "Step-by-step onboarding with progress indicator",
      category: "onboarding",
      tags: ["onboarding", "steps", "walkthrough", "progress", "tutorial"]
    },
    {
      id: "screen5",
      url: "/screenshots/settings-dark.jpg",
      title: "Settings Panel",
      description: "Organized settings page with dark mode toggle",
      category: "settings",
      tags: ["settings", "preferences", "toggle", "account", "dark mode"]
    },
    {
      id: "screen6",
      url: "/screenshots/dataviz-interactive.jpg",
      title: "Interactive Charts",
      description: "Interactive data visualization with tooltips and filters",
      category: "dashboard",
      tags: ["charts", "interactive", "data", "visualization", "filters"]
    },
    {
      id: "screen7",
      url: "/screenshots/gallery-masonry.jpg",
      title: "Image Gallery",
      description: "Masonry-style image gallery with lightbox preview",
      category: "content",
      tags: ["gallery", "images", "masonry", "lightbox", "portfolio"]
    },
    {
      id: "screen8",
      url: "/screenshots/checkout-multi-step.jpg",
      title: "Checkout Process",
      description: "Streamlined checkout with progress steps and payment options",
      category: "ecommerce",
      tags: ["checkout", "payment", "ecommerce", "steps", "cart"]
    },
    {
      id: "screen9",
      url: "/screenshots/mobile-nav.jpg",
      title: "Mobile Navigation",
      description: "Mobile-friendly navigation with icon tabs and notifications",
      category: "mobile",
      tags: ["mobile", "navigation", "tabs", "notifications", "responsive"]
    },
    {
      id: "screen10",
      url: "/screenshots/dark-theme.jpg",
      title: "Dark Mode Interface",
      description: "Elegant dark mode interface with accent colors",
      category: "theme",
      tags: ["dark mode", "theme", "ui", "minimal", "elegant"]
    },
    {
      id: "screen11",
      url: "/screenshots/webapp-dashboard.jpg",
      title: "Web App Dashboard",
      description: "Full-featured web application dashboard with sidebar navigation",
      category: "web application",
      tags: ["dashboard", "web app", "sidebar", "navigation", "admin"]
    },
    {
      id: "screen12",
      url: "/screenshots/ecommerce-product.jpg",
      title: "Product Display",
      description: "E-commerce product page with gallery and purchase options",
      category: "ecommerce",
      tags: ["product", "ecommerce", "gallery", "shopping", "retail"]
    }
  ];
  
  // Calculate relevance score for each screenshot based on keyword matches
  const scoredScreenshots = screenshotsDatabase.map(screenshot => {
    let score = 0;
    
    // Check tags for keyword matches
    keywords.forEach(keyword => {
      const lowercaseKeyword = keyword.toLowerCase();
      
      // Match against tags
      screenshot.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowercaseKeyword)) {
          score += 3;
        }
      });
      
      // Match against title and description
      if (screenshot.title.toLowerCase().includes(lowercaseKeyword)) {
        score += 2;
      }
      
      if (screenshot.description.toLowerCase().includes(lowercaseKeyword)) {
        score += 1;
      }
      
      // Match against category (highest weight)
      if (screenshot.category.toLowerCase().includes(lowercaseKeyword)) {
        score += 5;
      }
    });
    
    // Boost scores based on project type match
    if (projectType && (
      screenshot.category.toLowerCase().includes(projectType.toLowerCase()) ||
      screenshot.tags.some(tag => projectType.toLowerCase().includes(tag))
    )) {
      score += 10;
    }
    
    return { ...screenshot, score };
  });
  
  // Sort by relevance score and get top results
  return scoredScreenshots
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ score, ...rest }) => rest);
} 