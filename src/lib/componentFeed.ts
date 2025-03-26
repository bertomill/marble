import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, orderBy, limit, DocumentData, Timestamp } from 'firebase/firestore';

// Define the interface for component items
export interface ComponentItem {
  id?: string;
  type: 'Full App' | 'Screen' | 'Marketing Page' | 'UI Element' | 'Flow';
  title: string;
  description: string;
  image: string;
  url: string;
  category: string;
  createdAt?: Date;
}

// Define a type for Firestore timestamp
interface FirestoreTimestamp {
  toDate: () => Date;
}

/**
 * Fetch component feed items
 * @param filterType Optional filter by type
 * @param limitCount Number of items to return
 * @returns Promise with array of component items
 */
export async function getComponentFeed(
  filterType?: string,
  limitCount: number = 12
): Promise<ComponentItem[]> {
  try {
    // Create a reference to the components collection
    const componentsRef = collection(db, 'componentFeed');
    
    // Create a query based on the filter
    let q;
    if (filterType && filterType !== 'all') {
      q = query(
        componentsRef,
        where('type', '==', filterType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        componentsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    // Process the results
    const components: ComponentItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<ComponentItem, 'id'> & { createdAt?: FirestoreTimestamp | Date };
      components.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date()
      });
    });
    
    return components;
  } catch (error) {
    console.error('Error fetching component feed:', error);
    throw error;
  }
}

/**
 * Add a new component to the feed
 * @param component Component data to add
 * @returns Promise with the ID of the new component
 */
export async function addComponentToFeed(
  component: Omit<ComponentItem, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const componentsRef = collection(db, 'componentFeed');
    const docRef = await addDoc(componentsRef, {
      ...component,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding component to feed:', error);
    throw error;
  }
}