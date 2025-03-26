'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WebsiteExample } from '@/types/WebsiteExamples';
import { getWebsiteExampleById } from '@/utils/firebase/websiteExamples';
import { useAuth } from '@/contexts/AuthContext';

export default function WebsiteExampleDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [websiteExample, setWebsiteExample] = useState<WebsiteExample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [showComponents, setShowComponents] = useState(false);

  useEffect(() => {
    const fetchWebsiteExample = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error('Invalid website example ID');
        }
        
        const example = await getWebsiteExampleById(id);
        if (!example) {
          throw new Error('Website example not found');
        }
        
        setWebsiteExample(example);
        setError(null);
      } catch (err) {
        console.error('Error fetching website example:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWebsiteExample();
    }
  }, [id, user]);

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to view website examples</h1>
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-neutral-300">Loading website details...</span>
      </div>
    );
  }

  if (error || !websiteExample) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-medium text-white mb-2">Error Loading Website Example</h3>
        <p className="text-gray-400 mb-6">{error || 'Website example not found'}</p>
        <Link 
          href="/dashboard/discover" 
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-6 py-6 md:px-8 md:py-8">
      {/* Back button */}
      <Link 
        href="/dashboard/discover" 
        className="inline-flex items-center text-gray-300 hover:text-white mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Discover
      </Link>

      {/* Website header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-[#2a2545] rounded-lg flex items-center justify-center text-white text-xl font-bold">
              {websiteExample.title.charAt(0)}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{websiteExample.title}</h1>
          </div>
          <p className="text-gray-300 text-lg mb-3">{websiteExample.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {websiteExample.category.map((cat) => (
              <span key={cat} className="bg-[#2a2545] text-gray-300 px-3 py-1 rounded-full text-sm">
                {cat}
              </span>
            ))}
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              {websiteExample.type}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Added on {formatDate(websiteExample.createdAt)}
            {websiteExample.updatedAt > websiteExample.createdAt && 
              ` • Updated on ${formatDate(websiteExample.updatedAt)}`
            }
          </p>
        </div>
        <div className="flex gap-3">
          <a 
            href={websiteExample.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Website
          </a>
        </div>
      </div>

      {/* Tags */}
      {websiteExample.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {websiteExample.tags.map((tag) => (
              <span key={tag} className="bg-[#2a2545] text-gray-300 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Screenshots</h2>
          <button
            onClick={() => setShowComponents(!showComponents)}
            className="px-3 py-1 bg-[#2a2545] text-gray-300 rounded-md hover:bg-[#352f57] transition-colors text-sm flex items-center"
          >
            {showComponents ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7A9.97 9.97 0 014.02 8.971m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Hide Components
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Show Components
              </>
            )}
          </button>
        </div>

        {/* Main screenshot display */}
        <div className="bg-[#1a1625] rounded-lg overflow-hidden shadow-lg mb-4 relative">
          {websiteExample.screenshots[activeScreenshot] && (
            <>
              <img
                src={websiteExample.screenshots[activeScreenshot].imageUrl}
                alt={websiteExample.screenshots[activeScreenshot].altText}
                className="w-full object-contain max-h-[70vh]"
              />
              
              {/* Component annotations overlay */}
              {showComponents && websiteExample.screenshots[activeScreenshot].components && (
                <div className="absolute top-0 left-0 w-full h-full">
                  {websiteExample.screenshots[activeScreenshot].components.map((component) => (
                    component.boundingBox && (
                      <div
                        key={component.id}
                        className="absolute border-2 border-purple-500 bg-purple-500/20 rounded-md flex items-center justify-center"
                        style={{
                          left: `${component.boundingBox.x}%`,
                          top: `${component.boundingBox.y}%`,
                          width: `${component.boundingBox.width}%`,
                          height: `${component.boundingBox.height}%`,
                        }}
                      >
                        <div className="absolute -top-8 left-0 bg-purple-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {component.name}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              <div className="p-4">
                <p className="text-gray-300">
                  {websiteExample.screenshots[activeScreenshot].description}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Thumbnail navigation */}
        {websiteExample.screenshots.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {websiteExample.screenshots.map((screenshot, index) => (
              <button
                key={screenshot.id}
                onClick={() => setActiveScreenshot(index)}
                className={`relative rounded-md overflow-hidden border-2 ${
                  activeScreenshot === index ? 'border-purple-500' : 'border-transparent'
                }`}
              >
                <img
                  src={screenshot.imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Components section */}
      {websiteExample.screenshots[activeScreenshot]?.components?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteExample.screenshots[activeScreenshot].components.map((component) => (
              <div key={component.id} className="bg-[#1a1625] rounded-lg p-4">
                <h3 className="text-white font-medium mb-1">{component.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{component.description}</p>
                {component.tags && component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {component.tags.map((tag) => (
                      <span key={tag} className="bg-[#2a2545] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related examples section - placeholder for future enhancement */}
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Related Examples</h2>
        <div className="bg-[#1a1625] rounded-lg p-6 text-center">
          <p className="text-gray-400">
            Related examples will be shown here in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
