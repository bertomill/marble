import { NextRequest, NextResponse } from 'next/server';

// Define the backend API URL - use the Cloud Run URL from environment variables
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

interface Competitor {
  name: string;
  url: string;
  description: string;
  competitiveReason: string;
  jobId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body));
    
    // Check for direct parameters first (from updated frontend)
    let { businessDescription, industry, businessInfo } = body;

    if (!businessDescription && !businessInfo) {
      console.error('API request missing required business information');
      return NextResponse.json({ 
        error: 'Missing required parameters: businessDescription and industry' 
      }, { status: 400 });
    }

    // If we only have businessInfo but not businessDescription, extract them
    if (!businessDescription && businessInfo) {
      console.log('Extracting parameters from businessInfo:', businessInfo);
      
      // Extract industry from businessInfo if not provided directly
      if (!industry) {
        industry = 
          typeof businessInfo.industry === 'string' ? businessInfo.industry : 
          typeof businessInfo.businessType === 'string' ? businessInfo.businessType : 
          typeof businessInfo.businessNature === 'string' ? businessInfo.businessNature : 
          'business';
      }
      
      // Create a business description from all collected facts
      businessDescription = Object.entries(businessInfo)
        .map(([key, value]) => {
          // Format the key for better readability
          const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
          
          // Handle array values
          if (Array.isArray(value)) {
            return `${formattedKey}: ${value.join(', ')}`;
          }
          return `${formattedKey}: ${value}`;
        })
        .join('. ');
    }
    
    console.log('Forwarding to Cloud Run with parameters:', {
      businessDescription,
      industry
    });
    
    // Forward the request to the Cloud Run backend
    const response = await fetch(`${BACKEND_API_URL}/api/competitor/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessDescription,
        industry
      }),
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
    console.error('Error in competitor find API route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Competitor finder API. Use POST with businessInfo parameter to find competitors.',
  });
}