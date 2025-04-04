import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function GET() {
  try {
    // Check if the user is authenticated
    const user = auth.currentUser;
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        tip: 'You need to be logged in to add test data' 
      }, { status: 401 });
    }
    
    // Create test project data with feedback
    const projectData = {
      name: "API Test Project",
      description: "This is a test project created via API route",
      feedback: "This is test feedback from the API route",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'completed',
      uid: user.uid,
      userEmail: user.email || 'unknown@example.com'
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    
    return NextResponse.json({
      success: true,
      message: 'Test data added successfully',
      projectId: docRef.id,
      projectData
    });
    
  } catch (error) {
    console.error('Error adding test data:', error);
    
    return NextResponse.json({
      error: 'Failed to add test data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 