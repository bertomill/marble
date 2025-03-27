// Script to check projects in Firestore and verify userId fields
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

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

async function checkProjects() {
  try {
    console.log('\n🔍 Checking projects collection...');
    const projectsRef = db.collection('projects');
    const snapshot = await projectsRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No projects found in the database.');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} projects.`);
    
    // Track userIds for analysis
    const userIds = {};
    const projectsWithoutUserId = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!userId) {
        projectsWithoutUserId.push({
          id: doc.id,
          data
        });
        return;
      }
      
      if (!userIds[userId]) {
        userIds[userId] = [];
      }
      
      userIds[userId].push({
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'Unknown'
      });
    });
    
    // Report on user distribution
    console.log('\n👤 Projects by User:');
    console.log('==================');
    
    Object.keys(userIds).forEach(userId => {
      console.log(`\nUser ID: ${userId}`);
      console.log(`Projects: ${userIds[userId].length}`);
      console.log('Project list:');
      
      userIds[userId].forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (ID: ${project.id}) - Created: ${project.createdAt}`);
      });
    });
    
    // Report on projects without userId
    if (projectsWithoutUserId.length > 0) {
      console.log('\n⚠️ Projects WITHOUT userId field:');
      console.log('===============================');
      
      projectsWithoutUserId.forEach((project, index) => {
        console.log(`\n${index + 1}. Project ID: ${project.id}`);
        console.log('Data:', JSON.stringify(project.data, null, 2));
      });
      
      console.log(`\n❌ Found ${projectsWithoutUserId.length} projects with missing userId field.`);
      console.log('These projects will not be accessible with current security rules!');
    }
    
  } catch (error) {
    console.error('⚠️ Error checking projects:', error);
  }
}

// Run the check
checkProjects(); 