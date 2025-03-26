'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  WebsiteExample, 
  WEBSITE_CATEGORIES 
} from '@/types/WebsiteExamples';
import { 
  getAllWebsiteExamples, 
  getWebsiteExamplesByCategory
} from '@/utils/firebase/websiteExamples';

export default function DiscoverPage() {
  const [websiteExamples, setWebsiteExamples] = useState<WebsiteExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('Apps');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Fetch website examples data
  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true);
      try {
        let examples: WebsiteExample[] = [];
        
        // If we have real Firebase integration
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          if (activeFilter === 'all') {
            examples = await getAllWebsiteExamples();
          } else {
            examples = await getWebsiteExamplesByCategory(activeFilter);
          }
          
          if (activeTab !== 'Apps') {
            examples = examples.filter(example => example.type === activeTab);
          }
        } else {
          // Mock data for development
          const mockExamples: WebsiteExample[] = [
            {
              id: '1',
              title: 'Linktree',
              description: 'Everything you are, in one simple link',
              url: 'https://linktr.ee',
              category: ['Business'],
              type: 'App',
              tags: ['portfolio', 'bio', 'link-in-bio'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Linktree',
                  altText: 'Linktree homepage',
                  description: 'Linktree homepage showing bio link options',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Hero Section',
                      description: 'A clean, minimal hero section with a clear value proposition',
                      componentType: 'Hero Section',
                      tags: ['minimal', 'clean'],
                    },
                    {
                      id: 'component_2',
                      name: 'Call to Action Button',
                      description: 'High-contrast sign-up button',
                      componentType: 'Button',
                      tags: ['cta', 'conversion'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
            },
            {
              id: '2',
              title: 'Cosmos',
              description: 'A discovery engine for creatives',
              url: 'https://cosmos.so',
              category: ['Design'],
              type: 'App',
              tags: ['discovery', 'inspiration', 'design'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Cosmos',
                  altText: 'Cosmos main interface',
                  description: 'Cosmos discovery dashboard showing inspiration feed',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Search Bar',
                      description: 'A prominent search bar with auto-suggestions',
                      componentType: 'Search Bar',
                      tags: ['search', 'discovery'],
                    },
                    {
                      id: 'component_2',
                      name: 'Card Grid',
                      description: 'Responsive grid of inspiration cards with hover effects',
                      componentType: 'Card',
                      tags: ['grid', 'gallery'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
            },
            {
              id: '3',
              title: 'Miro',
              description: 'Workspace for innovation',
              url: 'https://miro.com',
              category: ['Productivity'],
              type: 'App',
              tags: ['whiteboard', 'collaboration', 'remote-work'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Miro',
                  altText: 'Miro whiteboard interface',
                  description: 'Miro collaborative workspace with digital sticky notes',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Toolbar',
                      description: 'Vertical toolbar with drawing and editing tools',
                      componentType: 'Menu',
                      tags: ['tools', 'editor'],
                    },
                    {
                      id: 'component_2',
                      name: 'Canvas',
                      description: 'Infinite canvas with zoom and pan capabilities',
                      componentType: 'UI Element',
                      tags: ['workspace', 'interactive'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
            },
            {
              id: '4',
              title: 'Notion',
              description: 'All-in-one workspace',
              url: 'https://notion.so',
              category: ['Productivity'],
              type: 'App',
              tags: ['note-taking', 'knowledge-base', 'wiki'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Notion',
                  altText: 'Notion workspace',
                  description: 'Notion document editor with database view',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Sidebar Navigation',
                      description: 'Hierarchical sidebar with collapsible sections',
                      componentType: 'Navigation',
                      tags: ['sidebar', 'hierarchy'],
                    },
                    {
                      id: 'component_2',
                      name: 'Block Editor',
                      description: 'Block-based content editor with drag-and-drop',
                      componentType: 'Form',
                      tags: ['editor', 'blocks'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
            },
            {
              id: '5',
              title: 'Figma',
              description: 'Design platform for teams',
              url: 'https://figma.com',
              category: ['Design'],
              type: 'App',
              tags: ['design', 'prototyping', 'collaboration'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Figma',
                  altText: 'Figma interface',
                  description: 'Figma design tool interface with component panel',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Properties Panel',
                      description: 'Contextual properties panel that changes based on selection',
                      componentType: 'UI Element',
                      tags: ['properties', 'settings'],
                    },
                    {
                      id: 'component_2',
                      name: 'Component Browser',
                      description: 'Visual library of reusable components with search',
                      componentType: 'UI Element',
                      tags: ['components', 'library'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
            },
            {
              id: '6',
              title: 'Shopify',
              description: 'E-commerce platform',
              url: 'https://shopify.com',
              category: ['Shopping'],
              type: 'App',
              tags: ['ecommerce', 'store', 'retail'],
              screenshots: [
                {
                  id: 'screenshot_1',
                  imageUrl: 'https://via.placeholder.com/400x300?text=Shopify',
                  altText: 'Shopify admin dashboard',
                  description: 'Shopify merchant dashboard with analytics',
                  components: [
                    {
                      id: 'component_1',
                      name: 'Dashboard Cards',
                      description: 'Analytics cards with key store metrics',
                      componentType: 'Card',
                      tags: ['analytics', 'dashboard'],
                    },
                    {
                      id: 'component_2',
                      name: 'Navigation',
                      description: 'Left sidebar with store management options',
                      componentType: 'Navigation',
                      tags: ['sidebar', 'admin'],
                    }
                  ]
                }
              ],
              createdAt: Date.now() - 42 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now() - 42 * 24 * 60 * 60 * 1000,
            },
          ];

          // Handle category filtering
          examples = activeFilter === 'all' 
            ? mockExamples 
            : mockExamples.filter(example => example.category.includes(activeFilter));
            
          // Handle type filtering
          if (activeTab !== 'Apps') {
            examples = examples.filter(example => example.type === activeTab);
          }
          
          // Handle search
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            examples = examples.filter(example => {
              return (
                example.title.toLowerCase().includes(query) ||
                example.description.toLowerCase().includes(query) ||
                example.tags.some(tag => tag.toLowerCase().includes(query)) ||
                example.screenshots.some(screenshot => 
                  screenshot.description.toLowerCase().includes(query) ||
                  screenshot.components.some(component => 
                    component.name.toLowerCase().includes(query) ||
                    component.description.toLowerCase().includes(query)
                  )
                )
              );
            });
          }
        }

        // Add a small delay to simulate API call
        setTimeout(() => {
          setWebsiteExamples(examples);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching website examples:', error);
        setLoading(false);
      }
    };

    fetchExamples();
  }, [activeFilter, activeTab, searchQuery]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered on submit (the state is already updated via onChange)
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to discover website examples</h1>
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
    <div className="p-6 max-w-full">
      {/* Page header - similar to Mobbin's design */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Discover</h1>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/dashboard/discover/components" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Components
          </Link>
          <Link 
            href="/dashboard/discover/scrape" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Scrape Website
          </Link>
          <Link 
            href="/dashboard/discover/add-example" 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Example
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex w-full">
          <input
            type="text"
            placeholder="Search for components, styles, or websites..."
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

      {/* Tabs - Apps, Screens, Marketing Pages, etc. */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {['Apps', 'Screen', 'Marketing Page', 'UI Element', 'Flow'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 relative ${
                activeTab === tab
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></span>
              )}
            </button>
          ))}
          <span className="py-2 text-gray-400 bg-[#2a2545] px-3 rounded-md text-sm font-medium">PRO</span>
        </nav>
      </div>

      {/* Category Filters */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
            } transition-colors`}
          >
            <div className="flex items-center">
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </span>
              Filters
            </div>
          </button>
          
          {WEBSITE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleFilterChange(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                activeFilter === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
              } transition-colors`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Website Examples Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-neutral-300">Loading examples...</span>
        </div>
      ) : websiteExamples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-2">No examples found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? `No results match your search "${searchQuery}".` 
              : activeFilter !== 'all' 
                ? `No examples found in the "${activeFilter}" category.` 
                : 'No website examples have been added yet.'}
          </p>
          <Link 
            href="/dashboard/discover/add-example" 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Your First Example
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {websiteExamples.map((example) => (
            <div key={example.id} className="bg-[#1a1625] rounded-lg overflow-hidden shadow-md">
              {/* Website main screenshot */}
              <div className="h-64 overflow-hidden">
                <img
                  src={example.screenshots[0]?.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={example.screenshots[0]?.altText || example.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              
              {/* Screenshot counter */}
              {example.screenshots.length > 1 && (
                <div className="absolute top-2 right-2 bg-[#1a1625] text-white text-xs px-2 py-1 rounded-full">
                  {example.screenshots.length} screenshots
                </div>
              )}
              
              {/* Website Info */}
              <div className="p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#2a2545] rounded-lg flex items-center justify-center text-white font-bold">
                    {example.title.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{example.title}</h3>
                    <p className="text-gray-400 text-sm">{example.description}</p>
                  </div>
                </div>
                
                {/* Tags */}
                {example.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {example.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {example.tags.length > 3 && (
                      <span className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        +{example.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <a 
                    href={example.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center"
                  >
                    Visit Website
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  
                  <Link
                    href={`/dashboard/discover/${example.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
                  >
                    Details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (simplified) */}
      {websiteExamples.length > 0 && (
        <div className="mt-10 flex justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((page) => (
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
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2545] text-gray-300 hover:bg-[#352f57]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 