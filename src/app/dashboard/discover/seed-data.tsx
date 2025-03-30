'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

// Sample mock data for screenshots
const mockScreenshots = [
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Dashboard+Design',
    title: 'Modern Dashboard Design',
    description: 'A clean and modern dashboard interface with dark mode support.',
    tags: ['dashboard', 'dark', 'minimal', 'modern'],
    likes: 42,
    comments: 7,
    category: 'Dashboards'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=E-commerce+Landing',
    title: 'E-commerce Landing Page',
    description: 'Responsive landing page for an online clothing store.',
    tags: ['e-commerce', 'responsive', 'light', 'minimal'],
    likes: 38,
    comments: 5,
    category: 'E-commerce'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Mobile+App+UI',
    title: 'Fitness App UI Design',
    description: 'Mobile app interface for tracking workouts and nutrition.',
    tags: ['mobile', 'app', 'colorful', 'ui design'],
    likes: 64,
    comments: 12,
    category: 'Mobile Apps'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Blog+Template',
    title: 'Minimalist Blog Template',
    description: 'Clean blog template with excellent typography and readability.',
    tags: ['blog', 'minimal', 'typography', 'clean'],
    likes: 27,
    comments: 3,
    category: 'Blogs'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Analytics+Dashboard',
    title: 'Analytics Dashboard',
    description: 'Complex data visualization dashboard with interactive charts.',
    tags: ['dashboard', 'data', 'charts', 'analytics'],
    likes: 51,
    comments: 9,
    category: 'Dashboards'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=SaaS+Landing',
    title: 'SaaS Product Landing Page',
    description: 'Marketing page for a software as a service product.',
    tags: ['saas', 'landing page', 'modern', 'marketing'],
    likes: 33,
    comments: 6,
    category: 'Landing Pages'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Portfolio+Design',
    title: 'Creative Portfolio Design',
    description: 'Unique portfolio website for a graphic designer.',
    tags: ['portfolio', 'creative', 'colorful', 'design'],
    likes: 72,
    comments: 15,
    category: 'UI Design'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Admin+Panel',
    title: 'Admin Control Panel',
    description: 'Comprehensive admin panel with multiple views and controls.',
    tags: ['admin', 'dashboard', 'ui design', 'controls'],
    likes: 45,
    comments: 8,
    category: 'Dashboards'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Online+Store',
    title: 'Online Store Product Page',
    description: 'Product detail page with gallery and purchase options.',
    tags: ['e-commerce', 'product', 'gallery', 'shopping'],
    likes: 39,
    comments: 7,
    category: 'E-commerce'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=News+App',
    title: 'News Reading App Interface',
    description: 'Mobile app design for browsing and reading news articles.',
    tags: ['mobile', 'news', 'reading', 'app'],
    likes: 28,
    comments: 4,
    category: 'Mobile Apps'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Music+Player',
    title: 'Music Player UI',
    description: 'Dark mode music player with visualizations and playlist management.',
    tags: ['music', 'dark', 'player', 'ui design'],
    likes: 56,
    comments: 11,
    category: 'UI Design'
  },
  {
    imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Travel+Blog',
    title: 'Travel Blog Template',
    description: 'Photo-centric blog layout perfect for travel content.',
    tags: ['blog', 'travel', 'photos', 'responsive'],
    likes: 41,
    comments: 8,
    category: 'Blogs'
  }
];

export default function SeedData() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const seedData = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setMessage('Error: You must be logged in to seed data.');
        setIsLoading(false);
        return;
      }
      
      const screenshotsRef = collection(db, 'screenshots');
      
      for (const screenshot of mockScreenshots) {
        await addDoc(screenshotsRef, {
          ...screenshot,
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Anonymous User',
          userAvatar: currentUser.photoURL || ''
        });
      }
      
      setMessage(`Successfully added ${mockScreenshots.length} screenshots to the database.`);
    } catch (error) {
      console.error('Error seeding data:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to seed data'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border border-gray-800 rounded-md mt-6">
      <h2 className="text-lg font-medium mb-4">Development Tools</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Seed the database with mock screenshot data for development purposes.
        This will add {mockScreenshots.length} screenshot entries to your Firestore database.
      </p>
      
      <Button 
        onClick={seedData} 
        disabled={isLoading}
        className="mb-2"
      >
        {isLoading ? 'Seeding Data...' : 'Seed Mock Data'}
      </Button>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
          {message}
        </div>
      )}
    </div>
  );
} 