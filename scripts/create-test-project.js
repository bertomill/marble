// Script to create a test project for a specific user
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to your service account key
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

// Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
  console.error('⚠️ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = getFirestore();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createTestProject(userId) {
  try {
    // Create a sample project document
    const projectData = {
      name: `Test Project - ${new Date().toLocaleString()}`,
      userId: userId,
      createdAt: new Date(),
      visibility: 'Public',
      url: `test-project-${Date.now()}.marble.app`,
      businessInfo: {
        businessType: 'Test',
        industry: 'Technology',
        targetAudience: 'Developers'
      }
    };
    
    // Add the document to the projects collection
    const docRef = await db.collection('projects').add(projectData);
    console.log('✅ Sample project created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('⚠️ Error adding sample project:', error);
    throw error;
  }
}

function main() {
  rl.question('👤 Enter the user ID to create a project for: ', async (userId) => {
    if (!userId.trim()) {
      console.log('❌ No user ID provided. Operation cancelled.');
      rl.close();
      return;
    }
    
    try {
      const projectId = await createTestProject(userId);
      console.log(`\n🎉 Successfully created test project with ID: ${projectId} for user: ${userId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      rl.close();
    }
  });
}

// Start the script
main(); 