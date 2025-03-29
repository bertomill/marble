'use client';

import { useState, useEffect } from 'react';

export default function VideoTest() {
  const [videoStatus, setVideoStatus] = useState('Loading...');
  
  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      // Log video element metadata
      console.log('Video element found:', videoElement);
      console.log('Current src:', videoElement.currentSrc);
      console.log('Network state:', videoElement.networkState);
      console.log('Ready state:', videoElement.readyState);
      
      videoElement.addEventListener('loadeddata', () => {
        console.log('Video loaded successfully');
        setVideoStatus('Video loaded successfully');
      });
      
      videoElement.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setVideoStatus(`Error: ${videoElement.error?.message || 'Unknown error'}`);
      });
      
      videoElement.addEventListener('stalled', () => {
        console.log('Video stalled');
        setVideoStatus('Video stalled');
      });
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Video Test Page</h1>
      
      <div className="w-full max-w-3xl mb-8">
        <p className="mb-4">Status: {videoStatus}</p>
        
        <video 
          controls
          width="100%" 
          className="mb-8 border border-gray-700"
          poster="/images/dark-hero-bg.jpg"
        >
          <source src="/videos/test.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="mt-8 p-4 bg-gray-800 rounded overflow-auto">
          <h2 className="text-xl font-bold mb-2">Debugging Info:</h2>
          <p>Video path: /videos/test.mp4</p>
          <p>Check browser console for more details</p>
        </div>
      </div>
      
      <div className="mt-8">
        <a 
          href="/" 
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
} 