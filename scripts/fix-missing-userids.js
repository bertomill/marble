// Script to fix projects with missing userId field
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

async function findProjectsWithoutUserId() {
  try {
    console.log('\n🔍 Searching for projects without userId...');
    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef.get();
    
    if (snapshot.empty) {
      console.log('No projects found in the database.');
      return [];
    }
    
    const projectsWithoutUserId = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.userId) {
        projectsWithoutUserId.push({
          id: doc.id,
          name: data.name || 'Unnamed project',
          data
        });
      }
    });
    
    return projectsWithoutUserId;
  } catch (error) {
    console.error('⚠️ Error finding projects:', error);
    return [];
  }
}

async function fixProjects(projectsToFix, userId) {
  try {
    console.log(`\n🔧 Fixing ${projectsToFix.length} projects with user ID: ${userId}`);
    
    let successCount = 0;
    const batch = db.batch();
    
    projectsToFix.forEach(project => {
      const projectRef = db.collection('projects').doc(project.id);
      batch.update(projectRef, { userId: userId });
      console.log(`  - Adding userId to project: ${project.name} (${project.id})`);
    });
    
    await batch.commit();
    console.log(`\n✅ Successfully updated ${projectsToFix.length} projects!`);
    
  } catch (error) {
    console.error('⚠️ Error fixing projects:', error);
  }
}

async function main() {
  try {
    // Find all projects without userId
    const projectsWithoutUserId = await findProjectsWithoutUserId();
    
    if (projectsWithoutUserId.length === 0) {
      console.log('✅ All projects have a userId field!');
      rl.close();
      return;
    }
    
    console.log(`\n⚠️ Found ${projectsWithoutUserId.length} projects without userId:`);
    projectsWithoutUserId.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (${project.id})`);
    });
    
    // Ask for user ID to assign
    rl.question('\n👤 Enter the user ID to assign to these projects: ', async (userId) => {
      if (!userId.trim()) {
        console.log('❌ No user ID provided. Operation cancelled.');
        rl.close();
        return;
      }
      
      // Confirm before proceeding
      rl.question(`\n⚠️ You are about to add userId: ${userId} to ${projectsWithoutUserId.length} projects. Continue? (y/n): `, async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await fixProjects(projectsWithoutUserId, userId);
        } else {
          console.log('❌ Operation cancelled.');
        }
        rl.close();
      });
    });
    
  } catch (error) {
    console.error('⚠️ Error in main process:', error);
    rl.close();
  }
}

// Start the script
main(); 