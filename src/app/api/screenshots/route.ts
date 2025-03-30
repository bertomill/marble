import { NextResponse } from 'next/server';

// Mock screenshots database - you'll replace this with your actual Firebase implementation
const screenshotsDatabase = [
  {
    id: "screen1",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fdashboard1.jpg?alt=media",
    title: "Analytics Dashboard",
    description: "Modern dashboard with key metrics and colorful charts",
    category: "dashboard",
    tags: ["analytics", "charts", "dashboard", "admin", "data visualization", "modern"]
  },
  {
    id: "screen2",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fprofile1.jpg?alt=media",
    title: "User Profile",
    description: "Clean user profile with avatar, stats and activity feed",
    category: "profile",
    tags: ["profile", "user", "avatar", "stats", "activity", "minimal"]
  },
  {
    id: "screen3",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Flanding1.jpg?alt=media",
    title: "Landing Hero",
    description: "Bold landing page with gradient background and call-to-action",
    category: "marketing",
    tags: ["landing", "hero", "gradient", "cta", "marketing", "bold"]
  },
  {
    id: "screen4",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fonboarding1.jpg?alt=media",
    title: "Onboarding Flow",
    description: "Step-by-step onboarding with progress indicator",
    category: "onboarding",
    tags: ["onboarding", "steps", "walkthrough", "progress", "tutorial"]
  },
  {
    id: "screen5",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fsettings1.jpg?alt=media",
    title: "Settings Panel",
    description: "Organized settings page with dark mode toggle",
    category: "settings",
    tags: ["settings", "preferences", "toggle", "account", "dark mode"]
  },
  {
    id: "screen6",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fchart1.jpg?alt=media",
    title: "Interactive Charts",
    description: "Interactive data visualization with tooltips and filters",
    category: "dashboard",
    tags: ["charts", "interactive", "data", "visualization", "filters"]
  },
  {
    id: "screen7",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fgallery1.jpg?alt=media",
    title: "Image Gallery",
    description: "Masonry-style image gallery with lightbox preview",
    category: "content",
    tags: ["gallery", "images", "masonry", "lightbox", "portfolio"]
  },
  {
    id: "screen8",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fcheckout1.jpg?alt=media",
    title: "Checkout Process",
    description: "Streamlined checkout with progress steps and payment options",
    category: "ecommerce",
    tags: ["checkout", "payment", "ecommerce", "steps", "cart"]
  },
  {
    id: "screen9",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fmobile1.jpg?alt=media",
    title: "Mobile Navigation",
    description: "Mobile-friendly navigation with icon tabs and notifications",
    category: "mobile",
    tags: ["mobile", "navigation", "tabs", "notifications", "responsive"]
  },
  {
    id: "screen10",
    url: "https://firebasestorage.googleapis.com/v0/b/yourbucket/o/screenshots%2Fdark1.jpg?alt=media",
    title: "Dark Mode Interface",
    description: "Elegant dark mode interface with accent colors",
    category: "theme",
    tags: ["dark mode", "theme", "ui", "minimal", "elegant"]
  }
];

interface SearchParams {
  keywords: string[];
  projectType?: string;
  designPreferences?: string;
  limit?: number;
}

export async function POST(request: Request) {
  try {
    const { keywords, projectType, designPreferences, limit = 6 } = await request.json() as SearchParams;
    
    // In the future, replace this with your Firebase implementation
    // For example, using Firebase SDK to query your database
    
    // Calculate relevance score for each screenshot based on keyword matches
    const scoredScreenshots = screenshotsDatabase.map(screenshot => {
      let score = 0;
      
      // Check tags for keyword matches
      keywords.forEach(keyword => {
        const lowercaseKeyword = keyword.toLowerCase();
        
        // Match against tags (higher weight)
        screenshot.tags.forEach(tag => {
          if (tag.toLowerCase().includes(lowercaseKeyword)) {
            score += 3;
          }
        });
        
        // Match against title and description (medium weight)
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
      if (projectType && screenshot.tags.some(tag => 
        projectType.toLowerCase().includes(tag.toLowerCase())
      )) {
        score += 3;
      }
      
      // Boost scores based on design preferences match
      if (designPreferences) {
        const designKeywords = designPreferences.toLowerCase().split(/\s+/);
        designKeywords.forEach(keyword => {
          if (screenshot.tags.some(tag => tag.toLowerCase().includes(keyword))) {
            score += 2;
          }
        });
      }
      
      return { ...screenshot, relevanceScore: score };
    });
    
    // Sort by relevance score and limit results
    const sortedScreenshots = scoredScreenshots
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
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