import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { message, type, rating, source } = body;
    
    if (!message) {
      return NextResponse.json({ 
        error: 'Missing required field: message' 
      }, { status: 400 });
    }
    
    // Get current user if authenticated
    const user = auth.currentUser;
    
    // Create feedback data
    const feedbackData = {
      message,
      type: type || 'general', // general, bug, feature, etc.
      rating: rating || null, // Optional rating (1-5)
      source: source || 'app', // Where the feedback was submitted from
      createdAt: serverTimestamp(),
      status: 'new',
      // User info if authenticated
      userId: user?.uid || null,
      userEmail: user?.email || null,
      anonymous: !user
    };
    
    // Add to Firestore feedback collection
    const docRef = await addDoc(collection(db, 'feedback'), feedbackData);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: docRef.id
    });
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    return NextResponse.json({
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// For testing - also allow GET requests to add sample feedback
export async function GET() {
  try {
    // Get current user if authenticated
    const user = auth.currentUser;
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        tip: 'You need to be logged in to add test feedback' 
      }, { status: 401 });
    }
    
    // Create sample feedback
    const sampleFeedback = {
      message: "This is a sample feedback submission. The app looks great!",
      type: "general",
      rating: 5,
      source: "api-test",
      createdAt: serverTimestamp(),
      status: "new",
      userId: user.uid,
      userEmail: user.email,
      anonymous: false
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'feedback'), sampleFeedback);
    
    return NextResponse.json({
      success: true,
      message: 'Sample feedback added successfully',
      feedbackId: docRef.id,
      feedback: {...sampleFeedback, createdAt: new Date().toISOString()}
    });
    
  } catch (error) {
    console.error('Error adding sample feedback:', error);
    
    return NextResponse.json({
      error: 'Failed to add sample feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 