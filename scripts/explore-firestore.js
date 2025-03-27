// Script to explore Firestore database structure
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

async function listCollections() {
  try {
    const collections = await db.listCollections();
    console.log('\n📚 Collections in Firestore:');
    console.log('==========================');
    
    if (collections.length === 0) {
      console.log('No collections found.');
      return;
    }
    
    for (const collection of collections) {
      console.log(`- ${collection.id}`);
    }
    
    // Ask user which collection to explore
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n🔍 Enter a collection name to explore (or press Enter to quit): ', async (collectionName) => {
      if (collectionName) {
        await listDocuments(collectionName);
      }
      readline.close();
    });
    
  } catch (error) {
    console.error('⚠️ Error listing collections:', error);
  }
}

async function listDocuments(collectionName, limit = 5) {
  try {
    console.log(`\n📄 Documents in "${collectionName}" collection (limited to ${limit}):`)
    console.log('=============================================');
    
    const snapshot = await db.collection(collectionName).limit(limit).get();
    
    if (snapshot.empty) {
      console.log('No documents found in this collection.');
      return;
    }
    
    snapshot.forEach(doc => {
      console.log(`\nDocument ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
    
    // Show document count
    const countSnapshot = await db.collection(collectionName).count().get();
    console.log(`\nTotal documents in collection: ${countSnapshot.data().count}`);
    
  } catch (error) {
    console.error(`⚠️ Error listing documents in ${collectionName}:`, error);
  }
}

// Start by listing collections
listCollections(); 