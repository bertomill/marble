'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Screenshot } from '@/types/Screenshot';
import { getScreenshotById } from '@/utils/firebase/screenshots';
import { useAuth } from '@/contexts/AuthContext';

export default function ScreenshotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchScreenshot = async () => {
      setLoading(true);
      try {
        if (!params || !params.id) {
          setError('Missing screenshot ID');
          setLoading(false);
          return;
        }
        const id = params.id as string;
        const data = await getScreenshotById(id);
        
        if (data) {
          setScreenshot(data);
        } else {
          setError('Screenshot not found');
        }
      } catch (err) {
        console.error('Error fetching screenshot:', err);
        setError('Failed to load screenshot');
      } finally {
        setLoading(false);
      }
    };

    fetchScreenshot();
  }, [params?.id, user, router]);

  // Format date from timestamp
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null; // We're redirecting, so don't render anything
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-300">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <Link href="/dashboard/discover" className="hover:text-gray-300">
            Discover
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Screenshot Details</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-neutral-300">Loading screenshot details...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="text-red-500 mb-4">{error}</div>
          <Link 
            href="/dashboard/discover" 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Discover
          </Link>
        </div>
      ) : screenshot ? (
        <div>
          {/* Screenshot header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {screenshot.title || screenshot.siteName || 'Untitled Screenshot'}
              </h1>
              {screenshot.description && (
                <p className="text-gray-400 mt-2">{screenshot.description}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0 space-x-3">
              {screenshot.url && (
                <a
                  href={screenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              )}
              <Link 
                href="/dashboard/discover"
                className="inline-flex items-center px-4 py-2 bg-[#2a2545] text-white rounded-md hover:bg-[#352f57] transition-colors"
              >
                Back to Discover
              </Link>
            </div>
          </div>

          {/* Screenshot content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column - Screenshot image */}
            <div className="md:col-span-2">
              <div className="bg-[#1a1625] rounded-lg overflow-hidden shadow-lg mb-8">
                <img
                  src={screenshot.imageUrl}
                  alt={screenshot.altText || screenshot.title || 'Screenshot'}
                  className="w-full object-contain max-h-[70vh]"
                />
              </div>
            </div>

            {/* Right column - Screenshot details */}
            <div>
              <div className="bg-[#1a1625] rounded-lg p-6 shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Screenshot Information</h2>
                
                <div className="space-y-4">
                  {screenshot.siteName && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Website Name</h3>
                      <p className="text-white">{screenshot.siteName}</p>
                    </div>
                  )}
                  
                  {screenshot.captureDate && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Capture Date</h3>
                      <p className="text-white">{screenshot.captureDate}</p>
                    </div>
                  )}
                  
                  {screenshot.platform && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Platform</h3>
                      <p className="text-white">{screenshot.platform}</p>
                    </div>
                  )}
                  
                  {screenshot.type && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Type</h3>
                      <p className="text-white">{screenshot.type}</p>
                    </div>
                  )}
                  
                  {screenshot.createdAt && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Added On</h3>
                      <p className="text-white">{formatDate(screenshot.createdAt instanceof Date ? screenshot.createdAt : new Date(screenshot.createdAt.seconds * 1000))}</p>
                    </div>
                  )}
                  
                  {screenshot.referenceNumber && (
                    <div>
                      <h3 className="text-gray-400 text-sm">Reference Number</h3>
                      <p className="text-white">{screenshot.referenceNumber}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Categories */}
              {screenshot.category && screenshot.category.length > 0 && (
                <div className="bg-[#1a1625] rounded-lg p-6 shadow-lg mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {screenshot.category.map((cat) => (
                      <span key={cat} className="bg-[#2a2545] text-gray-300 px-3 py-1 rounded-full text-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {screenshot.tags && screenshot.tags.length > 0 && (
                <div className="bg-[#1a1625] rounded-lg p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {screenshot.tags.map((tag) => (
                      <span key={tag} className="bg-[#2a2545] text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-white mb-4">No screenshot data available</div>
          <Link 
            href="/dashboard/discover" 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Discover
          </Link>
        </div>
      )}
    </div>
  );
} 