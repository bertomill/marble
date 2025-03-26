import { NextRequest, NextResponse } from 'next/server';

// Define the backend API URL - use the Cloud Run URL from environment variables
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

interface AnalysisJob {
  status: 'processing' | 'completed' | 'failed';
  url: string;
  created: Date;
  results: AnalysisResults | null;
  error?: string;
}

interface AnalysisResults {
  analysis: AnalysisData;
  screenshot: string;
  completedAt: Date;
}

interface AnalysisData {
  visualDesign: {
    colors: string[];
    typography: string[];
    layout: string;
  };
  keyFeatures: string[];
  contentStrategy: string;
  strengths: string[];
  weaknesses: string[];
  uniqueSellingPoints: string[];
  inspirationElements: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobIds } = body;

    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json({ error: 'Missing or invalid jobIds parameter' }, { status: 400 });
    }

    console.log(`Forwarding status check for jobs: ${jobIds.join(', ')} to Cloud Run API`);
    
    // Forward the request to the Cloud Run backend
    const response = await fetch(`${BACKEND_API_URL}/api/competitor/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobIds }),
    });
    
    if (!response.ok) {
      // Try to extract detailed error information
      try {
        const errorData = await response.json();
        console.error(`Cloud Run API error (${response.status}):`, errorData);
        return NextResponse.json(errorData, { status: response.status });
      } catch (parseError) {
        console.error(`Cloud Run API error (${response.status}), couldn't parse error:`, parseError);
        return NextResponse.json({ 
          error: `Error from backend: ${response.statusText}` 
        }, { status: response.status });
      }
    }
    
    const result = await response.json();
    console.log('Cloud Run API response:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in competitor status API route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Competitor analysis status API. Use POST with jobIds parameter to check status.',
  });
}