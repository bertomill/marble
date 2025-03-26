'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  WebsiteExample, 
  ComponentAnnotation,
  COMPONENT_TYPES 
} from '@/types/WebsiteExamples';
import { 
  getAllWebsiteExamples
} from '@/utils/firebase/websiteExamples';

export default function ComponentsPage() {
  const [websiteExamples, setWebsiteExamples] = useState<WebsiteExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponentType, setActiveComponentType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredComponents, setFilteredComponents] = useState<{
    component: ComponentAnnotation;
    websiteTitle: string;
    websiteUrl: string;
    screenshotUrl: string;
  }[]>([]);
  const { user } = useAuth();

  // Fetch website examples data
  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true);
      
      try {
        // Fetch real data from Firebase
        console.log('Fetching components from Firebase...');
        const examples = await getAllWebsiteExamples();
        console.log('Retrieved examples:', examples);
        
        // Count total components for logging
        const componentCount = examples.reduce((total, website) => {
          return total + website.screenshots.reduce((count, screenshot) => {
            return count + (screenshot.components?.length || 0);
          }, 0);
        }, 0);
        
        console.log(`Found ${examples.length} websites with ${componentCount} total components`);
        setWebsiteExamples(examples);
      } catch (error) {
        console.error('Error fetching website examples:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is authenticated
    if (user) {
      fetchExamples();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Process components from all screenshots
  useEffect(() => {
    if (websiteExamples.length > 0) {
      const allComponents = websiteExamples.flatMap(website => {
        return website.screenshots.flatMap(screenshot => {
          return screenshot.components.map(component => ({
            component,
            websiteTitle: website.title,
            websiteUrl: website.url,
            screenshotUrl: screenshot.imageUrl
          }));
        });
      });
      
      setFilteredComponents(allComponents);
    }
  }, [websiteExamples]);

  // Handle search and filtering
  useEffect(() => {
    if (websiteExamples.length > 0) {
      const allComponents = websiteExamples.flatMap(website => {
        return website.screenshots.flatMap(screenshot => {
          return screenshot.components.map(component => ({
            component,
            websiteTitle: website.title,
            websiteUrl: website.url,
            screenshotUrl: screenshot.imageUrl
          }));
        });
      });
      
      // Filter by component type
      let filtered = allComponents;
      if (activeComponentType !== 'All') {
        filtered = filtered.filter(item => 
          item.component.componentType === activeComponentType
        );
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.component.name.toLowerCase().includes(query) ||
          item.component.description.toLowerCase().includes(query) ||
          item.component.tags.some(tag => tag.toLowerCase().includes(query)) ||
          item.websiteTitle.toLowerCase().includes(query)
        );
      }
      
      setFilteredComponents(filtered);
    }
  }, [websiteExamples, activeComponentType, searchQuery]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already handled by the useEffect above
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to view components</h1>
          <Link 
            href="/login" 
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-5xl font-bold text-white">UI Components</h1>
        <div className="flex space-x-3">
          <Link 
            href="/dashboard/discover/scrape" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Scrape Website
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex w-full">
          <input
            type="text"
            placeholder="Search for components by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-5 py-3 bg-[#2a2545] text-white rounded-l-md border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Component Type Filters */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            onClick={() => setActiveComponentType('All')}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              activeComponentType === 'All'
                ? 'bg-purple-600 text-white'
                : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
            } transition-colors`}
          >
            All Components
          </button>
          
          {COMPONENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveComponentType(type)}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                activeComponentType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
              } transition-colors`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Component Display */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-neutral-300">Loading components...</span>
        </div>
      ) : filteredComponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No components found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? `No components match your search "${searchQuery}".` 
              : activeComponentType !== 'All' 
                ? `No components found of type "${activeComponentType}".` 
                : 'No components have been analyzed yet.'}
          </p>
          <Link 
            href="/dashboard/discover/scrape" 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Analyze Your First Screenshot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((item, index) => (
            <div key={index} className="bg-[#1a1625] rounded-lg overflow-hidden shadow-md flex flex-col">
              {/* Screenshot area */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src={item.screenshotUrl}
                  alt={item.component.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1625] to-transparent opacity-70"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                    {item.component.componentType}
                  </span>
                </div>
              </div>
              
              {/* Component info */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-white font-semibold text-lg mb-1">{item.component.name}</h3>
                <p className="text-gray-400 text-sm mb-3 flex-1">{item.component.description}</p>
                
                {/* Tags */}
                {item.component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.component.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {item.component.tags.length > 5 && (
                      <span className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        +{item.component.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* From website */}
                <div className="mt-auto pt-3 border-t border-[#352f57] flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    From <span className="text-purple-400">{item.websiteTitle}</span>
                  </div>
                  
                  <a 
                    href={item.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
                  >
                    Visit Site
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - simplified version */}
      {filteredComponents.length > 12 && (
        <div className="mt-10 flex justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  page === 1
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 