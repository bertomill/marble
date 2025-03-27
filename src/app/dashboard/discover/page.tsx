'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  getAllScreenshots,
  getScreenshotsByCategory,
  getScreenshotsByPlatform,
  searchScreenshots
} from '@/utils/firebase/screenshots';
import { SCREENSHOT_PLATFORMS, SCREENSHOT_CATEGORIES, Screenshot } from '@/types/Screenshot';
import { addMultipleSampleScreenshots } from '@/utils/firebase/addSampleScreenshot';

// Define a list of platforms for the tabs
const PLATFORMS = SCREENSHOT_PLATFORMS;

export default function DiscoverPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('Web');
  const [searchQuery, setSearchQuery] = useState('');
  const [addingTestData, setAddingTestData] = useState(false);
  // New state variables for infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Track which screenshot cards have expanded tags
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastScreenshotRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  /**
   * How the Infinite Scroll works:
   * 
   * 1. We maintain a 'page' state variable that tracks which page we're on
   * 2. The 'hasMore' state indicates whether there are more results to load
   * 3. The 'loadingMore' state shows when we're fetching additional data
   * 
   * The implementation uses the Intersection Observer API to detect when the user
   * scrolls to the bottom of the current list of screenshots:
   * 
   * - We attach a reference (lastScreenshotRef) to either the last screenshot card
   *   or a dedicated loading element at the bottom of the list
   * - When this element becomes visible, we trigger loading the next page
   * - This creates a smooth infinite scrolling experience without pagination buttons
   * 
   * The fetchScreenshots function handles both initial loads and appending
   * new data when scrolling, using the 'append' parameter to determine behavior.
   */

  // Fetch screenshots data with pagination support
  const fetchScreenshots = useCallback(async (pageNumber = 1, append = false) => {
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const maxResultsPerPage = 9; // Number of items per page
      let data: Screenshot[] = [];
      
      // For new page loads, use the limit parameter in the Firebase queries
      if (searchQuery.trim()) {
        // If there's a search query, search across all screenshots
        // For search, still fetch all and filter on client side since it's already client-side searching
        const allData = await searchScreenshots(searchQuery, 100);
        
        // Then manually paginate the results
        const start = (pageNumber - 1) * maxResultsPerPage;
        const end = start + maxResultsPerPage;
        data = allData.slice(start, end);
        setHasMore(end < allData.length);
      } else if (activeFilter !== 'all') {
        // Filter by category with pagination
        const resultsLimit = append ? pageNumber * maxResultsPerPage : maxResultsPerPage;
        data = await getScreenshotsByCategory(activeFilter, resultsLimit);
        
        // If we're appending, only take the new items
        if (append) {
          data = data.slice((pageNumber - 1) * maxResultsPerPage);
        }
        
        // Check if there's likely more data (if we got exactly the number requested)
        setHasMore(data.length === maxResultsPerPage);
      } else if (activeTab !== 'all') {
        // Filter by platform with pagination
        const resultsLimit = append ? pageNumber * maxResultsPerPage : maxResultsPerPage;
        data = await getScreenshotsByPlatform(activeTab, resultsLimit);
        
        // If we're appending, only take the new items
        if (append) {
          data = data.slice((pageNumber - 1) * maxResultsPerPage);
        }
        
        // Check if there's likely more data
        setHasMore(data.length === maxResultsPerPage);
      } else {
        // Get all screenshots with pagination
        const resultsLimit = append ? pageNumber * maxResultsPerPage : maxResultsPerPage;
        data = await getAllScreenshots(resultsLimit);
        
        // If we're appending, only take the new items
        if (append) {
          data = data.slice((pageNumber - 1) * maxResultsPerPage);
        }
        
        // Check if there's likely more data
        setHasMore(data.length === maxResultsPerPage);
      }
      
      // Add a small delay to simulate API call (remove in production)
      setTimeout(() => {
        if (append) {
          setScreenshots(prev => [...prev, ...data]);
        } else {
          setScreenshots(data);
        }
        setLoading(false);
        setLoadingMore(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      setLoading(false);
      setLoadingMore(false);
      // Set empty array on error
      if (!append) {
        setScreenshots([]);
      }
    }
  }, [activeFilter, activeTab, searchQuery]);

  // Initial load of screenshots
  useEffect(() => {
    // Reset pagination when filters change
    setPage(1);
    setHasMore(true);
    fetchScreenshots(1, false);
  }, [activeFilter, activeTab, searchQuery, fetchScreenshots]);

  // Load more screenshots when scrolling
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchScreenshots(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchScreenshots]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    // Create a new intersection observer that watches for when the target element becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        // When the target element is visible and we have more data to load
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          // Load the next page of data
          loadMore();
        }
      },
      // Configure the observer to trigger when the element is 10% visible
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    // Save the observer to the ref so we can access it later
    observerRef.current = observer;
    
    // Clean up the observer when the component unmounts or dependencies change
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  // Observe the last screenshot element
  useEffect(() => {
    // Get a reference to the last screenshot element (or the loading indicator at the bottom)
    const lastElementRef = lastScreenshotRef.current;
    const observer = observerRef.current;
    
    // If both the element and observer exist
    if (lastElementRef && observer) {
      // First disconnect any existing observations
      observer.disconnect();
      // Then observe the new last element
      observer.observe(lastElementRef);
    }
  }, [screenshots]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered on submit (the state is already updated via onChange)
  };

  // Add sample screenshots for testing
  const handleAddSampleScreenshots = async () => {
    setAddingTestData(true);
    try {
      await addMultipleSampleScreenshots(5);
      // Refresh the list of screenshots
      setPage(1);
      fetchScreenshots(1, false);
    } catch (error) {
      console.error('Error adding sample screenshots:', error);
    } finally {
      setAddingTestData(false);
    }
  };

  // Toggle expanded tags for a screenshot
  const toggleExpandTags = (screenshotId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [screenshotId]: !prev[screenshotId]
    }));
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
    <div className="w-full h-full overflow-x-hidden px-4 sm:px-6 pb-8">
      {/* Page header - similar to Mobbin's design */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Discover</h1>
          {/* Test data button for any logged-in user */}
          {user && (
            <button
              onClick={handleAddSampleScreenshots}
              disabled={addingTestData}
              className="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {addingTestData ? 'Adding...' : 'Add Test Data'}
            </button>
          )}
        </div>
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

      {/* Tabs - Web, Mobile, Tablet, etc. */}
      <div className="mb-6">
        <div className="w-full overflow-x-auto scrollbar-thin">
          <nav className="flex space-x-8 pb-2 min-w-max">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 relative whitespace-nowrap ${
                activeTab === 'all'
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              All Platforms
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></span>
              )}
            </button>
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={`py-2 relative whitespace-nowrap ${
                  activeTab === platform
                    ? 'text-white font-medium'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {platform}
                {activeTab === platform && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></span>
                )}
              </button>
            ))}
            <span className="py-2 text-gray-400 bg-[#2a2545] px-3 rounded-md text-sm font-medium whitespace-nowrap">PRO</span>
          </nav>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8">
        <div className="w-full overflow-x-auto scrollbar-thin">
          <div className="flex space-x-2 pb-2 min-w-max">
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
            
            {SCREENSHOT_CATEGORIES.map((category) => (
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
      </div>

      {/* Screenshots Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-neutral-300">Loading screenshots...</span>
        </div>
      ) : screenshots.length === 0 ? (
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
                : activeTab !== 'all'
                  ? `No examples found for platform "${activeTab}".`
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenshots.map((screenshot, index) => (
            <div 
              key={screenshot.id} 
              className="bg-[#1a1625] rounded-lg overflow-hidden shadow-md"
              ref={index === screenshots.length - 1 ? lastScreenshotRef : null}
            >
              {/* Screenshot image */}
              <div className="h-64 overflow-hidden relative">
                <img
                  src={screenshot.imageUrl}
                  alt={screenshot.altText || screenshot.siteName || 'Screenshot'}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                {screenshot.captureDate && (
                  <div className="absolute top-2 right-2 bg-[#1a1625]/90 text-white text-xs px-2 py-1 rounded-full">
                    {screenshot.captureDate}
                  </div>
                )}
              </div>
              
              {/* Screenshot Info */}
              <div className="p-5">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#2a2545] rounded-lg flex items-center justify-center text-white font-bold">
                    {screenshot.siteName?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{screenshot.siteName || screenshot.title}</h3>
                    <p className="text-gray-400 text-sm truncate">{screenshot.description || `${screenshot.platform || 'Web'} UI Screenshot`}</p>
                  </div>
                </div>
                
                {/* Categories */}
                {screenshot.category && screenshot.category.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {screenshot.category.map((cat: string) => (
                      <span 
                        key={cat} 
                        className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs transition-colors hover:bg-[#382f70] hover:text-white"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Tags */}
                {screenshot.tags && screenshot.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {/* Show all tags if expanded, otherwise only show first 3 */}
                    {(expandedTags[screenshot.id] ? screenshot.tags : screenshot.tags.slice(0, 3)).map((tag: string) => (
                      <span 
                        key={tag} 
                        className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs transition-colors hover:bg-[#382f70] hover:text-white"
                      >
                        {tag}
                      </span>
                    ))}
                    {/* Show "more" button only if not expanded and has more than 3 tags */}
                    {!expandedTags[screenshot.id] && screenshot.tags.length > 3 && (
                      <button
                        onClick={() => toggleExpandTags(screenshot.id)}
                        className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs hover:bg-purple-700 hover:text-white transition-colors cursor-pointer"
                      >
                        +{screenshot.tags.length - 3} more
                      </button>
                    )}
                    {/* Show "less" button if expanded */}
                    {expandedTags[screenshot.id] && (
                      <button
                        onClick={() => toggleExpandTags(screenshot.id)}
                        className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs hover:bg-purple-700 hover:text-white transition-colors cursor-pointer"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between">
                  {screenshot.url && (
                    <a 
                      href={screenshot.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center"
                    >
                      Visit Website
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  
                  <Link
                    href={`/dashboard/discover/screenshot/${screenshot.id}`}
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

      {/* Infinite Scroll Loading Indicator - replaces pagination */}
      {screenshots.length > 0 && (
        <div className="mt-10 flex justify-center">
          {loadingMore ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
              <span className="text-neutral-300 text-sm">Loading more...</span>
            </div>
          ) : hasMore ? (
            <div 
              className="h-10" 
              ref={lastScreenshotRef}
              aria-label="Load more content trigger"
            ></div>
          ) : (
            <div className="text-neutral-400 text-sm py-2">
              You&apos;ve reached the end of the list
            </div>
          )}
        </div>
      )}
    </div>
  );
} 