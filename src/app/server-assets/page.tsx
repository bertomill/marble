'use client';

// Import the image from assets folder
import heroImage from '../assets/hero.png';
import Link from 'next/link';
import Image from 'next/image';

export default function ServerAssets() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Server-Side Assets Test</h1>
      
      <div className="max-w-4xl mx-auto">
        <p className="mb-6">
          This page uses images from the app/assets folder instead of the public folder.
          The images are optimized by Next.js Image component and bundled with the application.
        </p>
        
        <div className="relative w-full bg-gray-800 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Next.js Image Component:</h2>
          <p className="mb-4">
            This uses the optimized Next.js Image component with the imported image:
          </p>
          
          <div className="relative border border-gray-600 rounded overflow-hidden">
            <Image 
              src={heroImage}
              alt="Hero Image" 
              priority
              className="w-full"
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <p>Benefits of server-side assets with Next.js Image:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Automatic image optimization (formats, sizes)</li>
              <li>Lazy loading and priority loading control</li>
              <li>Prevents layout shift with proper sizing</li>
              <li>Included in build process for bundling</li>
              <li>Better performance with modern formats</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-bold mb-2">Debug Info:</h2>
          <p>Image import path: '../assets/hero.png'</p>
          <p>Image type: Static import with Next.js Image component</p>
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