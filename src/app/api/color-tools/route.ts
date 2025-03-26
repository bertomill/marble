import { NextRequest, NextResponse } from 'next/server';

// Define the backend API URL - will come from environment variables in production
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    let endpoint;
    switch (action) {
      case 'extract-colors':
        endpoint = '/api/extract-colors';
        break;
      case 'extract-from-website':
        endpoint = '/api/extract-from-website';
        break;
      case 'generate-palette':
        endpoint = '/api/generate-palette';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.error || 'Backend service error' }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Color tools API is available. Use POST method with appropriate action parameter.',
    availableActions: ['extract-colors', 'extract-from-website', 'generate-palette'],
  });
} 