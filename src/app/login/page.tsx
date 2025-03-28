'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const searchParams = useSearchParams();
  const showSignup = searchParams?.get('mode') === 'signup';
  
  // Ensure video plays properly
  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
        videoElement.play().catch(error => {
          console.error('Error playing video:', error);
        });
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      
      // If video is already loaded
      if (videoElement.readyState >= 3) {
        handleLoadedData();
      }
      
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className={`absolute w-full h-full object-cover video-smooth ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit: 'cover', transition: 'opacity 0.5s ease-in-out' }}
        >
          <source src="/marble_ball.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay to darken the video */}
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <LoginForm showSignupInitially={showSignup} />
      </div>
    </div>
  );
}