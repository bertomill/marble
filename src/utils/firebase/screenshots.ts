import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  doc, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Screenshot } from '@/types/Screenshot';

const SCREENSHOTS_COLLECTION = 'screenshots';

// Convert Firestore document to Screenshot object
const screenshotConverter = {
  toFirestore: (screenshot: Screenshot): DocumentData => {
    return {
      altText: screenshot.altText,
      captureDate: screenshot.captureDate,
      category: screenshot.category || [],
      createdAt: screenshot.createdAt || Timestamp.now(),
      updatedAt: screenshot.updatedAt || Timestamp.now(),
      description: screenshot.description,
      fileName: screenshot.fileName,
      imageUrl: screenshot.imageUrl,
      platform: screenshot.platform,
      referenceNumber: screenshot.referenceNumber,
      siteName: screenshot.siteName,
      tags: screenshot.tags || [],
      title: screenshot.title,
      type: screenshot.type,
      url: screenshot.url,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Screenshot => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      altText: data.altText,
      captureDate: data.captureDate,
      category: data.category || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      description: data.description,
      fileName: data.fileName,
      imageUrl: data.imageUrl,
      platform: data.platform,
      referenceNumber: data.referenceNumber,
      siteName: data.siteName,
      tags: data.tags || [],
      title: data.title,
      type: data.type,
      url: data.url,
    };
  }
};

/**
 * Get all screenshots from the database
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of Screenshot objects
 */
export const getAllScreenshots = async (maxResults = 50): Promise<Screenshot[]> => {
  try {
    const screenshotsQuery = query(
      collection(db, SCREENSHOTS_COLLECTION).withConverter(screenshotConverter),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(screenshotsQuery);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting screenshots:', error);
    return [];
  }
};

/**
 * Get screenshots by category
 * @param category Category to filter by
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of Screenshot objects
 */
export const getScreenshotsByCategory = async (category: string, maxResults = 20): Promise<Screenshot[]> => {
  try {
    const screenshotsQuery = query(
      collection(db, SCREENSHOTS_COLLECTION).withConverter(screenshotConverter),
      where('category', 'array-contains', category),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(screenshotsQuery);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting screenshots by category:', error);
    return [];
  }
};

/**
 * Get screenshots by platform
 * @param platform Platform to filter by
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of Screenshot objects
 */
export const getScreenshotsByPlatform = async (platform: string, maxResults = 20): Promise<Screenshot[]> => {
  try {
    const screenshotsQuery = query(
      collection(db, SCREENSHOTS_COLLECTION).withConverter(screenshotConverter),
      where('platform', '==', platform),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(screenshotsQuery);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting screenshots by platform:', error);
    return [];
  }
};

/**
 * Get a screenshot by ID
 * @param id Screenshot ID
 * @returns Promise with Screenshot object or null if not found
 */
export const getScreenshotById = async (id: string): Promise<Screenshot | null> => {
  try {
    const screenshotDoc = await getDoc(
      doc(db, SCREENSHOTS_COLLECTION, id).withConverter(screenshotConverter)
    );
    
    if (screenshotDoc.exists()) {
      return screenshotDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting screenshot by ID:', error);
    return null;
  }
};

/**
 * Search screenshots by keyword
 * Note: This is a client-side search. For large collections, consider using
 * a proper search service like Algolia or Firebase's extended search capabilities.
 * 
 * @param keyword Keyword to search for
 * @param maxResults Maximum number of results to return
 * @returns Promise with array of Screenshot objects
 */
export const searchScreenshots = async (keyword: string, maxResults = 20): Promise<Screenshot[]> => {
  try {
    // Get all screenshots first
    const allScreenshots = await getAllScreenshots(100); // Limit to 100 to avoid fetching too many
    
    // Search through the screenshots (client-side)
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    const filteredScreenshots = allScreenshots.filter(screenshot => {
      return (
        // Search in text fields
        (screenshot.siteName?.toLowerCase().includes(normalizedKeyword)) ||
        (screenshot.title?.toLowerCase().includes(normalizedKeyword)) ||
        (screenshot.description?.toLowerCase().includes(normalizedKeyword)) ||
        (screenshot.altText?.toLowerCase().includes(normalizedKeyword)) ||
        // Search in arrays
        (screenshot.tags?.some(tag => tag.toLowerCase().includes(normalizedKeyword))) ||
        (screenshot.category?.some(cat => cat.toLowerCase().includes(normalizedKeyword)))
      );
    });
    
    // Return only the specified number of results
    return filteredScreenshots.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching screenshots:', error);
    return [];
  }
}; 