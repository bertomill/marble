import { NextResponse } from 'next/server';

/**
 * Create a new project based on business info collected
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // In a real app, this would save to a database
    // For now, just return success with the data
    console.log('Project created:', data);
    
    return NextResponse.json({ 
      id: `proj_${Date.now()}`, 
      name: data.name,
      created: true
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 