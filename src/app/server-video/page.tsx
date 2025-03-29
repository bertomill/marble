'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function ServerVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Import the video dynamically on the client side
    const loadVideo = async () => {
      try {
        // Dynamic import for the video
        // This approach allows Next.js to handle the asset properly
        const videoUrl = (await import('../assets/test.mp4')).default;
        
        if (videoRef.current) {
          videoRef.current.src = videoUrl;
          console.log('Video source set to:', videoUrl);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      }
    };
    
    loadVideo();
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Server-Side Video Test</h1>
      
      <div className="max-w-4xl mx-auto">
        <p className="mb-6">
          This page uses videos from app/assets folder. The video is loaded dynamically 
          using Next.js dynamic imports, which optimizes how it's served.
        </p>
        
        <div className="relative w-full bg-gray-800 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Next.js Dynamic Import Video:</h2>
          
          <video 
            ref={videoRef}
            controls
            className="w-full border border-gray-600 rounded"
            playsInline
            poster="/images/dark-hero-bg.jpg"
          >
            Your browser does not support the video tag.
          </video>
          
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <p>Benefits of server-side video assets with Next.js:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Videos are processed during build</li>
              <li>Dynamic imports allow code-splitting for large videos</li>
              <li>Better integration with Next.js asset pipeline</li>
              <li>Videos can be versioned with your code</li>
              <li>Security: assets aren't directly exposed in public folder</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-bold mb-2">Debug Info:</h2>
          <p>Video import path: '../assets/test.mp4'</p>
          <p>Loading method: Dynamic import with useEffect</p>
          <p>Check browser console for any errors</p>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
} 