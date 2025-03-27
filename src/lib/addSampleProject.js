import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Adds a sample project for the specified user to test permissions
 * @param {string} userId - The ID of the user to create a project for
 * @returns {Promise<string>} The ID of the created project
 */
export async function addSampleProject(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Create a sample project document
    const projectData = {
      name: 'Test Project',
      userId: userId,
      createdAt: serverTimestamp(),
      visibility: 'Public',
      url: 'test-project.marble.app',
      businessInfo: {
        businessType: 'Test',
        industry: 'Technology',
        targetAudience: 'Developers'
      }
    };
    
    // Add the document to the projects collection
    const docRef = await addDoc(collection(db, 'projects'), projectData);
    console.log('Sample project created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding sample project:', error);
    throw error;
  }
} 