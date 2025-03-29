'use client';

import { useState, useEffect } from 'react';

export default function ImageTest() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Log for debugging
    console.log('Image test page loaded');
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Image Test Page</h1>
      
      <div className="max-w-4xl mx-auto">
        <p className="mb-6">Testing if hero.png can be loaded:</p>
        
        <div className="relative w-full bg-gray-800 rounded-lg p-4">
          <p className="mb-4">
            Direct Image (regular img tag):
          </p>
          
          <img 
            src="/hero.png"
            alt="Hero Image" 
            className="w-full max-w-2xl rounded border border-gray-600"
            onLoad={() => {
              console.log('Image loaded successfully');
              setImageLoaded(true);
            }}
            onError={() => {
              console.error('Image failed to load');
              setImageError(true);
            }}
          />
          
          <div className="mt-4">
            {imageLoaded && <p className="text-green-500">✓ Image loaded successfully</p>}
            {imageError && <p className="text-red-500">✗ Image failed to load</p>}
            {!imageLoaded && !imageError && <p className="text-yellow-500">Loading image...</p>}
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">CSS Background Image Test:</h2>
          
          <div 
            className="h-64 w-full rounded border border-gray-600"
            style={{
              backgroundImage: 'url("/hero.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-50">
              <p>This div has the image as a background</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-bold mb-2">Debug Info:</h2>
          <p>Image path: /hero.png</p>
          <p>Image size: ~1.4 MB</p>
          <p>Check browser console for any errors</p>
        </div>
        
        <div className="mt-8">
          <a 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
} 