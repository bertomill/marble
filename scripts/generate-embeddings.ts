import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}

async function generateEmbeddings() {
  try {
    const screenshotsRef = collection(db, 'screenshots');
    const snapshot = await getDocs(screenshotsRef);
    
    console.log(`Processing ${snapshot.size} screenshots...`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already has embedding
      if (data.embedding) {
        console.log(`Skipping ${doc.id} - already has embedding`);
        continue;
      }
      
      // Combine relevant fields for embedding
      const textToEmbed = [
        data.siteName,
        data.description,
        data.altText,
        data.extractedText,
        ...(data.tags || [])
      ].filter(Boolean).join(' ');
      
      if (!textToEmbed) {
        console.log(`Skipping ${doc.id} - no text content`);
        continue;
      }
      
      console.log(`Generating embedding for ${doc.id}...`);
      
      try {
        const embedding = await generateEmbedding(textToEmbed);
        
        // Update document with embedding
        await updateDoc(doc.ref, {
          embedding: embedding
        });
        
        console.log(`Updated ${doc.id} with embedding`);
      } catch (error) {
        console.error(`Error processing ${doc.id}:`, error);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Finished generating embeddings');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
generateEmbeddings(); 