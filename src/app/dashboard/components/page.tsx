'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getComponentFeed, ComponentItem } from '@/lib/componentFeed';

export default function ComponentsPage() {
  const [componentFeed, setComponentFeed] = useState<ComponentItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState('all');
  const router = useRouter();
  const { user } = useAuth();

  // Fetch component feed data
  useEffect(() => {
    const fetchComponentFeed = async () => {
      setFeedLoading(true);
      try {
        // In development or when Firebase isn't set up yet, use mock data
        if (process.env.NODE_ENV === 'development') {
          // Mock data for development
          const mockComponentFeed: ComponentItem[] = [
            {
              id: '1',
              type: 'Marketing Page',
              title: 'Linktree Landing Page',
              description: 'Everything you are, in one simple link',
              image: 'https://via.placeholder.com/300x200?text=Linktree',
              url: 'https://linktr.ee',
              category: 'Business'
            },
            {
              id: '2',
              type: 'UI Element',
              title: 'Cosmos Dashboard',
              description: 'A discovery engine for creatives',
              image: 'https://via.placeholder.com/300x200?text=Cosmos',
              url: 'https://cosmos.app',
              category: 'Design'
            },
            {
              id: '3',
              type: 'Full App',
              title: 'Miro Workspace',
              description: 'Workspace for innovation',
              image: 'https://via.placeholder.com/300x200?text=Miro',
              url: 'https://miro.com',
              category: 'Productivity'
            }
          ];

          // Add a small delay to simulate API call
          setTimeout(() => {
            setComponentFeed(mockComponentFeed);
            setFeedLoading(false);
          }, 1000);
        } else {
          // Real data from Firebase
          const components = await getComponentFeed(feedFilter !== 'all' ? feedFilter : undefined);
          setComponentFeed(components);
          setFeedLoading(false);
        }
      } catch (error) {
        console.error('Error fetching component feed:', error);
        setFeedLoading(false);
      }
    };

    fetchComponentFeed();
  }, [feedFilter]);

  // Handle feed filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFeedFilter(e.target.value);
  };

  const navigateToAddComponent = () => {
    router.push('/dashboard/add-component');
  };

  // If user is not logged in, redirect to login
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to view components</h1>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Component Inspiration</h1>
        <p className="text-gray-400 mt-2">Find inspiration from the best website components</p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        {/* What will you create today? */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">What will you use today?</h2>
        </div>
        
        {/* Filter and Add */}
        <div className="flex items-center space-x-2">
          <select 
            className="bg-[#2a2545] text-white border border-[#352f57] rounded-lg px-3 py-2 text-sm"
            onChange={handleFilterChange}
            value={feedFilter}
          >
            <option value="all">All Components</option>
            <option value="Full App">Full Apps</option>
            <option value="Screen">Screens</option>
            <option value="Marketing Page">Marketing Pages</option>
            <option value="UI Element">UI Elements</option>
            <option value="Flow">Flows</option>
          </select>
          <button
            onClick={navigateToAddComponent}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Creation Cards */}
      <div className="grid grid-cols-5 gap-4 mb-10">
        <div className="bg-[#2a2545] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#352f57] transition-colors">
          <div className="bg-purple-600 rounded-lg p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-white mb-1">Plan</h3>
            <p className="text-gray-400 text-xs">Schedule and invite guests</p>
          </div>
        </div>
        
        <div className="bg-[#2a2545] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#352f57] transition-colors">
          <div className="bg-purple-600 rounded-lg p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-white mb-1">Record</h3>
            <p className="text-gray-400 text-xs">Record or live stream</p>
          </div>
        </div>
        
        <div className="bg-[#2a2545] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#352f57] transition-colors">
          <div className="bg-purple-600 rounded-lg p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-white mb-1">Upload</h3>
            <p className="text-gray-400 text-xs">Edit and transcribe files</p>
          </div>
        </div>
        
        <div className="bg-[#2a2545] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#352f57] transition-colors">
          <div className="bg-purple-600 rounded-lg p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-white mb-1">Edit</h3>
            <p className="text-gray-400 text-xs">Create clips and episodes</p>
          </div>
        </div>
        
        <div className="bg-[#2a2545] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#352f57] transition-colors">
          <div className="bg-purple-600 rounded-lg p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-white mb-1">AI Voice</h3>
            <p className="text-gray-400 text-xs">Convert text to speech</p>
          </div>
        </div>
      </div>

      {/* Component Feed */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Components</h2>
        </div>

        {feedLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-neutral-300">Loading inspiration...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {componentFeed.map((component) => (
              <div key={component.id} className="bg-[#2a2545] rounded-lg shadow-xl border border-[#352f57] overflow-hidden hover:border-purple-500 transition-colors">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={component.image} 
                    alt={component.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded px-2 py-1">
                    {component.type}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white text-lg">{component.title}</h3>
                    <span className="bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-full text-xs">
                      {component.category}
                    </span>
                  </div>
                  <p className="text-neutral-400 text-sm mb-3">{component.description}</p>
                  <a 
                    href={component.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>Visit Website</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 