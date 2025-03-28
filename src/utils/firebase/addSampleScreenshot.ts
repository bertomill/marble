import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Screenshot } from '@/types/Screenshot';

const SCREENSHOTS_COLLECTION = 'screenshots';

/**
 * Adds a sample screenshot to the database for testing
 * @returns Promise with the new screenshot ID
 */
export const addSampleScreenshot = async (): Promise<string> => {
  try {
    // Create a sample screenshot object
    const now = Timestamp.now();
    const sampleScreenshot: Omit<Screenshot, 'id'> = {
      siteName: 'Sample Website',
      title: 'Homepage Design',
      description: 'A modern homepage design with clean UI elements',
      altText: 'Sample website homepage screenshot',
      imageUrl: 'https://source.unsplash.com/random/1200x800/?website',
      url: 'https://example.com',
      platform: 'Web',
      category: ['SaaS', 'Technology'],
      tags: ['modern', 'clean', 'responsive', 'dark mode', 'gradient'],
      captureDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      createdAt: now,
      updatedAt: now,
      fileName: 'sample-screenshot.jpg',
      referenceNumber: 'SAMPLE-001',
      type: 'Homepage',
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, SCREENSHOTS_COLLECTION), sampleScreenshot);
    console.log('Sample screenshot added with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding sample screenshot:', error);
    throw error;
  }
};

/**
 * Adds multiple sample screenshots to the database for testing
 * @param count Number of sample screenshots to add
 * @returns Promise with array of new screenshot IDs
 */
export const addMultipleSampleScreenshots = async (count: number = 5): Promise<string[]> => {
  try {
    const websiteTypes = ['Homepage', 'Landing Page', 'Dashboard', 'Profile', 'Settings', 'Checkout', 'Product Page'];
    const platforms = ['Web', 'Mobile', 'Tablet', 'Desktop'];
    const categories = ['E-commerce', 'SaaS', 'Portfolio', 'Blog', 'Social Media', 'Fintech', 'Healthcare'];
    const tags = ['modern', 'clean', 'responsive', 'dark mode', 'gradient', 'minimalist', 'colorful', 'flat design', 'glassmorphism', 'retro'];
    
    const ids: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const now = Timestamp.now();
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30)); // Random date within the last 30 days
      
      const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
      const randomType = websiteTypes[Math.floor(Math.random() * websiteTypes.length)];
      
      // Select 1-2 random categories
      const randomCategories: string[] = [];
      const categoryCount = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < categoryCount; j++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        if (!randomCategories.includes(cat)) {
          randomCategories.push(cat);
        }
      }
      
      // Select 2-5 random tags
      const randomTags: string[] = [];
      const tagCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < tagCount; j++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!randomTags.includes(tag)) {
          randomTags.push(tag);
        }
      }
      
      // Create sample screenshot
      const sampleScreenshot: Omit<Screenshot, 'id'> = {
        siteName: `Sample Website ${i + 1}`,
        title: `${randomType} Design ${i + 1}`,
        description: `A ${randomTags[0]} ${randomType.toLowerCase()} design for ${randomCategories[0].toLowerCase()} websites`,
        altText: `Sample ${randomType.toLowerCase()} screenshot ${i + 1}`,
        imageUrl: `https://source.unsplash.com/random/1200x800/?website,${randomType.replace(' ', '')}`,
        url: `https://example${i}.com`,
        platform: randomPlatform,
        category: randomCategories,
        tags: randomTags,
        captureDate: randomDate.toISOString().split('T')[0], // YYYY-MM-DD format
        createdAt: now,
        updatedAt: now,
        fileName: `sample-screenshot-${i + 1}.jpg`,
        referenceNumber: `SAMPLE-${String(i + 1).padStart(3, '0')}`,
        type: randomType,
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, SCREENSHOTS_COLLECTION), sampleScreenshot);
      ids.push(docRef.id);
      console.log(`Added sample screenshot ${i + 1} with ID:`, docRef.id);
    }
    
    console.log(`Added ${count} sample screenshots`);
    return ids;
  } catch (error) {
    console.error('Error adding sample screenshots:', error);
    throw error;
  }
}; 