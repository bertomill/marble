'use client';

import { useState, useEffect } from 'react';

export default function CleanHome() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Ensure video plays properly
  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
          setVideoError(true);
        });
      };
      
      const handleVideoError = (error: Event | Error) => {
        console.error('Video error:', error);
        setVideoError(true);
        setVideoLoaded(false);
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleVideoError);
      videoElement.addEventListener('stalled', () => handleVideoError(new Error('Video stalled')));
      
      // If video is already loaded
      if (videoElement.readyState >= 3) {
        handleLoadedData();
      }
      
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleVideoError);
        videoElement.removeEventListener('stalled', () => handleVideoError(new Error('Video stalled')));
      };
    }
  }, []);
  
  return (
    <main className="min-h-screen bg-black">
      <div className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-2xl font-bold">Marble</h1>
      </div>
      
      {/* Hero section with modern design */}
      <section className="relative min-h-[70vh] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          {/* Video Background or Fallback Image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {!videoError ? (
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className={`absolute w-full h-full object-cover ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ objectFit: 'cover', transition: 'opacity 0.5s ease-in-out' }}
                poster="/images/dark-hero-bg.jpg"
              >
                <source src="/limestone_bg.mp4" type="video/mp4" />
              </video>
            ) : (
              <div 
                className="absolute w-full h-full bg-center bg-cover opacity-60"
                style={{ 
                  backgroundImage: 'url("/images/dark-hero-bg.jpg")',
                  transform: 'scale(1.05)'
                }}
              ></div>
            )}
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black opacity-60"></div>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-8 leading-tight">
            <span className="block">discover and share</span>
            <span className="block">beautiful digital experiences</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mt-8 max-w-3xl mx-auto">
            Join our growing community of world-class designers and developers. 
            Access over 10,000 premiere digital screens and components.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a 
              href="/test" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-medium rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Go to test page
            </a>
            <a 
              href="/simple" 
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white text-lg font-medium rounded-lg hover:bg-white/10 transition duration-300 backdrop-blur-sm border border-white/20"
            >
              Go to simple page
            </a>
          </div>
        </div>
      </section>
    </main>
  );
} 