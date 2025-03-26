import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { WebsiteExample, Screenshot } from '@/types/WebsiteExamples';

const WEBSITE_EXAMPLES_COLLECTION = 'websiteExamples';

// Convert Firestore document to WebsiteExample object
const websiteExampleConverter = {
  toFirestore: (websiteExample: WebsiteExample): DocumentData => {
    return {
      title: websiteExample.title,
      description: websiteExample.description,
      url: websiteExample.url,
      category: websiteExample.category,
      type: websiteExample.type,
      tags: websiteExample.tags,
      screenshots: websiteExample.screenshots,
      createdAt: websiteExample.createdAt,
      updatedAt: websiteExample.updatedAt,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): WebsiteExample => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      description: data.description,
      url: data.url,
      category: data.category,
      type: data.type,
      tags: data.tags,
      screenshots: data.screenshots,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
};

// Add a new website example
export const addWebsiteExample = async (websiteExample: Omit<WebsiteExample, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const timestamp = Date.now();
  const newWebsiteExample = {
    ...websiteExample,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  const docRef = await addDoc(collection(db, WEBSITE_EXAMPLES_COLLECTION), newWebsiteExample);
  return docRef.id;
};

// Update an existing website example
export const updateWebsiteExample = async (id: string, updates: Partial<WebsiteExample>): Promise<void> => {
  const websiteExampleRef = doc(db, WEBSITE_EXAMPLES_COLLECTION, id);
  await updateDoc(websiteExampleRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

// Delete a website example
export const deleteWebsiteExample = async (id: string): Promise<void> => {
  const websiteExampleRef = doc(db, WEBSITE_EXAMPLES_COLLECTION, id);
  await deleteDoc(websiteExampleRef);
};

// Get a website example by ID
export const getWebsiteExampleById = async (id: string): Promise<WebsiteExample | null> => {
  const websiteExampleRef = doc(db, WEBSITE_EXAMPLES_COLLECTION, id).withConverter(websiteExampleConverter);
  const docSnap = await getDoc(websiteExampleRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
};

// Get all website examples
export const getAllWebsiteExamples = async (): Promise<WebsiteExample[]> => {
  const q = query(
    collection(db, WEBSITE_EXAMPLES_COLLECTION),
    orderBy('createdAt', 'desc')
  ).withConverter(websiteExampleConverter);
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

// Get website examples by category
export const getWebsiteExamplesByCategory = async (category: string): Promise<WebsiteExample[]> => {
  const q = query(
    collection(db, WEBSITE_EXAMPLES_COLLECTION),
    where('category', 'array-contains', category),
    orderBy('createdAt', 'desc')
  ).withConverter(websiteExampleConverter);
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

// Get website examples by type
export const getWebsiteExamplesByType = async (type: string): Promise<WebsiteExample[]> => {
  const q = query(
    collection(db, WEBSITE_EXAMPLES_COLLECTION),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  ).withConverter(websiteExampleConverter);
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

// Get website examples by tag
export const getWebsiteExamplesByTag = async (tag: string): Promise<WebsiteExample[]> => {
  const q = query(
    collection(db, WEBSITE_EXAMPLES_COLLECTION),
    where('tags', 'array-contains', tag),
    orderBy('createdAt', 'desc')
  ).withConverter(websiteExampleConverter);
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

// Search website examples by text query
export const searchWebsiteExamples = async (searchQuery: string): Promise<WebsiteExample[]> => {
  // This is a simple search implementation
  // For more advanced search, consider using a service like Algolia or implementing full-text search
  const allExamples = await getAllWebsiteExamples();
  const searchTerms = searchQuery.toLowerCase().split(' ');
  
  return allExamples.filter(example => {
    const titleMatches = searchTerms.some(term => 
      example.title.toLowerCase().includes(term)
    );
    
    const descriptionMatches = searchTerms.some(term => 
      example.description.toLowerCase().includes(term)
    );
    
    const tagMatches = example.tags.some(tag => 
      searchTerms.some(term => tag.toLowerCase().includes(term))
    );
    
    const categoryMatches = example.category.some(cat => 
      searchTerms.some(term => cat.toLowerCase().includes(term))
    );
    
    const componentMatches = example.screenshots.some(screenshot => 
      screenshot.components.some(component => 
        searchTerms.some(term => 
          component.name.toLowerCase().includes(term) || 
          component.description.toLowerCase().includes(term) ||
          component.tags.some(tag => tag.toLowerCase().includes(term))
        )
      )
    );
    
    return titleMatches || descriptionMatches || tagMatches || categoryMatches || componentMatches;
  });
};

// Upload a screenshot image
export const uploadScreenshotImage = async (file: File, websiteId: string, screenshotId: string): Promise<string> => {
  const storageRef = ref(storage, `screenshots/${websiteId}/${screenshotId}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Add a screenshot to a website example
export const addScreenshot = async (
  websiteId: string, 
  screenshot: Omit<Screenshot, 'id'>
): Promise<string> => {
  const websiteExample = await getWebsiteExampleById(websiteId);
  
  if (!websiteExample) {
    throw new Error(`Website example with ID ${websiteId} not found`);
  }
  
  const screenshotId = `screenshot_${Date.now()}`;
  const newScreenshot: Screenshot = {
    ...screenshot,
    id: screenshotId,
  };
  
  const updatedScreenshots = [...websiteExample.screenshots, newScreenshot];
  
  await updateWebsiteExample(websiteId, { 
    screenshots: updatedScreenshots,
    updatedAt: Date.now(),
  });
  
  return screenshotId;
};

// Update a screenshot
export const updateScreenshot = async (
  websiteId: string,
  screenshotId: string,
  updates: Partial<Screenshot>
): Promise<void> => {
  const websiteExample = await getWebsiteExampleById(websiteId);
  
  if (!websiteExample) {
    throw new Error(`Website example with ID ${websiteId} not found`);
  }
  
  const screenshotIndex = websiteExample.screenshots.findIndex(
    screenshot => screenshot.id === screenshotId
  );
  
  if (screenshotIndex === -1) {
    throw new Error(`Screenshot with ID ${screenshotId} not found`);
  }
  
  const updatedScreenshots = [...websiteExample.screenshots];
  updatedScreenshots[screenshotIndex] = {
    ...updatedScreenshots[screenshotIndex],
    ...updates,
  };
  
  await updateWebsiteExample(websiteId, { 
    screenshots: updatedScreenshots,
    updatedAt: Date.now(),
  });
};

// Delete a screenshot
export const deleteScreenshot = async (
  websiteId: string,
  screenshotId: string
): Promise<void> => {
  const websiteExample = await getWebsiteExampleById(websiteId);
  
  if (!websiteExample) {
    throw new Error(`Website example with ID ${websiteId} not found`);
  }
  
  const updatedScreenshots = websiteExample.screenshots.filter(
    screenshot => screenshot.id !== screenshotId
  );
  
  await updateWebsiteExample(websiteId, { 
    screenshots: updatedScreenshots,
    updatedAt: Date.now(),
  });
}; 