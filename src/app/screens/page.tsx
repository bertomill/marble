'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { PlusIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

// Screen type definition
interface Screen {
  id: string;
  imageUrl: string;
  title: string;
  sourceUrl?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
}

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get authenticated user from context

  // Fetch user screens from Firestore
  useEffect(() => {
    const fetchScreens = async () => {
      setIsLoading(true);
      try {
        if (!db) {
          // If Firebase isn't initialized yet, use mock data
          throw new Error("Firebase not initialized");
        }
        
        // Only fetch screens if user is logged in
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const screensQuery = query(
          collection(db, 'screens'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(screensQuery);
        
        const fetchedScreens: Screen[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedScreens.push({
            id: doc.id,
            imageUrl: data.imageUrl,
            title: data.title,
            sourceUrl: data.sourceUrl || undefined,
            tags: data.tags || [],
            notes: data.notes || '',
            createdAt: data.createdAt instanceof Timestamp ? 
              new Date(data.createdAt.seconds * 1000) : 
              new Date(),
          });
        });
        
        setScreens(fetchedScreens);
        
        // If no real screens exist yet, show mock data for demo purposes
        if (fetchedScreens.length === 0) {
          setScreens([
            {
              id: '1',
              imageUrl: 'https://placehold.co/600x400/5271ff/ffffff?text=Modern+Dashboard',
              title: 'Modern Dashboard Design',
              sourceUrl: 'https://example.com/dashboard-inspiration',
              tags: ['dashboard', 'modern', 'ui'],
              notes: 'Love the clean layout and color scheme',
              createdAt: new Date('2023-11-15')
            },
            {
              id: '2',
              imageUrl: 'https://placehold.co/600x400/ff5252/ffffff?text=E-commerce+Layout',
              title: 'E-commerce Product Page',
              sourceUrl: 'https://example.com/shop-inspiration',
              tags: ['e-commerce', 'product', 'layout'],
              notes: 'Great product display with excellent whitespace',
              createdAt: new Date('2023-12-10')
            },
            {
              id: '3',
              imageUrl: 'https://placehold.co/600x400/52ff7a/333333?text=Landing+Page',
              title: 'SaaS Landing Page',
              sourceUrl: 'https://example.com/landing-inspiration',
              tags: ['landing', 'saas', 'hero'],
              notes: 'Effective hero section with clear CTA',
              createdAt: new Date('2024-01-05')
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching screens:', err);
        setError('Failed to load screens. Please try again later.');
        // Fall back to mock data
        setScreens([
          {
            id: '1',
            imageUrl: 'https://placehold.co/600x400/5271ff/ffffff?text=Modern+Dashboard',
            title: 'Modern Dashboard Design',
            sourceUrl: 'https://example.com/dashboard-inspiration',
            tags: ['dashboard', 'modern', 'ui'],
            notes: 'Love the clean layout and color scheme',
            createdAt: new Date('2023-11-15')
          },
          {
            id: '2',
            imageUrl: 'https://placehold.co/600x400/ff5252/ffffff?text=E-commerce+Layout',
            title: 'E-commerce Product Page',
            sourceUrl: 'https://example.com/shop-inspiration',
            tags: ['e-commerce', 'product', 'layout'],
            notes: 'Great product display with excellent whitespace',
            createdAt: new Date('2023-12-10')
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScreens();
  }, [user]); // Add user as dependency to re-fetch when user changes

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (!user || !db) return;
    
    try {
      // Remove from UI first for immediate feedback
      setScreens(screens.filter(screen => screen.id !== screenId));
      
      // Then delete from database
      await deleteDoc(doc(db, 'screens', screenId));
    } catch (err) {
      console.error('Error deleting screen:', err);
      setError('Failed to delete screen. Please try again.');
      // Refetch screens to restore state
      fetchScreens();
    }
  };

  const fetchScreens = async () => {
    // This is a simplified version just to refresh the screens after deletion
    setIsLoading(true);
    try {
      if (!db || !user) return;
      
      const screensQuery = query(
        collection(db, 'screens'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(screensQuery);
      
      const fetchedScreens: Screen[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedScreens.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          title: data.title,
          sourceUrl: data.sourceUrl || undefined,
          tags: data.tags || [],
          notes: data.notes || '',
          createdAt: data.createdAt instanceof Timestamp ? 
            new Date(data.createdAt.seconds * 1000) : 
            new Date(),
        });
      });
      
      setScreens(fetchedScreens);
    } catch (err) {
      console.error('Error refreshing screens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Screens</h1>
        <Link href="/screens/new">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <PlusIcon className="h-4 w-4" />
            Save New Screen
          </button>
        </Link>
      </div>

      {!user ? (
        <div className="mt-8 border rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Please log in</h2>
          <p className="text-gray-500 mb-6">
            You need to be logged in to view and manage your saved screens.
          </p>
          <Link href="/login">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mx-auto transition-colors">
              Log In
            </button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-8 p-4 border border-red-300 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-200 animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {screens.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {screens.map((screen) => (
                    <div key={screen.id} className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="relative h-48 bg-gray-100">
                        <div className="relative w-full h-full">
                          <Image 
                            src={screen.imageUrl} 
                            alt={screen.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button 
                          onClick={() => handleDeleteScreen(screen.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          aria-label="Delete screen"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-1">{screen.title}</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {screen.tags?.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {screen.notes && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{screen.notes}</p>
                        )}
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-500">{formatDate(screen.createdAt)}</span>
                          {screen.sourceUrl && (
                            <a 
                              href={screen.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              Visit Source
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-8 border rounded-lg p-6 text-center">
                  <h2 className="text-xl font-bold mb-2">No screens saved yet</h2>
                  <p className="text-gray-500 mb-6">
                    Start saving screenshots of website designs you like for inspiration.
                  </p>
                  <Link href="/screens/new">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors">
                      <PlusIcon className="h-4 w-4" />
                      Save First Screen
                    </button>
                  </Link>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 