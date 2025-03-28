'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// Available interests categories
const INTEREST_CATEGORIES = [
  'E-commerce', 'SaaS', 'Technology', 'Finance', 'Healthcare', 
  'Education', 'Real Estate', 'Marketing', 'Travel', 'Food & Beverage',
  'Fashion', 'Beauty', 'Fitness', 'Entertainment', 'Media',
  'Manufacturing', 'Professional Services', 'Non-profit', 'Art & Design'
];

// Define the website type
interface Website {
  name: string;
  url: string;
  description: string;
}

// Sample websites by category (in a real app, these would come from an API)
const SAMPLE_WEBSITES: Record<string, Website[]> = {
  'E-commerce': [
    { name: 'Shopify', url: 'shopify.com', description: 'A leading e-commerce platform for online stores and retail point-of-sale systems' },
    { name: 'Etsy', url: 'etsy.com', description: 'Global marketplace for unique and creative goods' },
    { name: 'BigCommerce', url: 'bigcommerce.com', description: 'E-commerce platform for fast-growing businesses' },
  ],
  'SaaS': [
    { name: 'Slack', url: 'slack.com', description: 'Business communication platform offering many IRC-style features' },
    { name: 'Notion', url: 'notion.so', description: 'All-in-one workspace for notes, tasks, wikis, and databases' },
    { name: 'Airtable', url: 'airtable.com', description: 'Part spreadsheet, part database that lets you organize anything' }
  ],
  'Technology': [
    { name: 'Vercel', url: 'vercel.com', description: 'Platform for frontend frameworks and static sites' },
    { name: 'DigitalOcean', url: 'digitalocean.com', description: 'Cloud infrastructure provider' },
    { name: 'GitHub', url: 'github.com', description: 'Platform and cloud-based service for software development and version control' }
  ],
  // Add a few more categories for demonstration
  'Finance': [
    { name: 'Stripe', url: 'stripe.com', description: 'Online payment processing for internet businesses' },
    { name: 'Square', url: 'squareup.com', description: 'Financial services, merchant services aggregator, and mobile payment company' }
  ],
  'Healthcare': [
    { name: 'Oscar Health', url: 'hioscar.com', description: 'Health insurance company with a focus on technology' },
    { name: 'One Medical', url: 'onemedical.com', description: 'Membership-based primary care practice' }
  ]
};

export default function OnboardingPage() {
  const { user, userPreferences, updateUserPreferences } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [recommendedWebsites, setRecommendedWebsites] = useState<Website[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Ensure video plays properly
  useEffect(() => {
    if (isClient) {
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
    }
  }, [isClient]);
  
  // Check authentication
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (isClient && !user) {
      router.push('/login?redirect=%2Fonboarding');
      return;
    }
    
    // If already onboarded, redirect to dashboard
    if (isClient && user && userPreferences.onboardingComplete) {
      router.push('/dashboard');
    }
  }, [isClient, user, userPreferences.onboardingComplete, router]);
  
  // When interests are selected, generate recommended websites
  useEffect(() => {
    if (selectedInterests.length > 0) {
      // Get websites from selected interest categories
      const websites = selectedInterests.flatMap(interest => 
        SAMPLE_WEBSITES[interest as keyof typeof SAMPLE_WEBSITES] || []
      );
      
      // Remove duplicates
      const uniqueWebsites = [...new Map(websites.map(site => [site.name, site])).values()];
      
      if (isClient) {
        // Only do random sorting on the client side
        const randomWebsites = [...uniqueWebsites].sort(() => Math.random() - 0.5).slice(0, 6);
        setRecommendedWebsites(randomWebsites);
      } else {
        // On server, just take the first 6 without randomization
        setRecommendedWebsites(uniqueWebsites.slice(0, 6));
      }
    }
  }, [selectedInterests, isClient]);
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  // Toggle website selection
  const toggleWebsite = (websiteName: string) => {
    setSelectedWebsites(prev => 
      prev.includes(websiteName)
        ? prev.filter(w => w !== websiteName)
        : [...prev, websiteName]
    );
  };
  
  // Complete onboarding
  const completeOnboarding = () => {
    updateUserPreferences({
      onboardingComplete: true,
      interests: selectedInterests,
      suggestedWebsites: selectedWebsites
    });
    
    router.push('/dashboard');
  };
  
  // Handle next step
  const handleNext = () => {
    if (step === 1 && selectedInterests.length > 0) {
      setStep(2);
    } else if (step === 2) {
      completeOnboarding();
    }
  };
  
  // Marble logo component
  const SiteStackLogo = () => (
    <div className="flex items-center justify-center mb-6">
      <Image
        src="/marble-logo.svg"
        alt="Marble Logo"
        width={80}
        height={80}
        className="drop-shadow-lg"
      />
    </div>
  );
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    </div>
  );
  
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
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
      
      {/* Loading state */}
      {isLoading && (
        <div className="relative z-20 flex flex-col items-center space-y-6">
          <SiteStackLogo />
          <LoadingSpinner />
        </div>
      )}
      
      {/* Main content */}
      {!isLoading && (
        <div className="relative z-20 w-full max-w-md mx-auto">
          <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
            {step === 1 && (
              <div className="p-8">
                <SiteStackLogo />
                
                <h1 className="text-2xl font-medium text-white text-center mb-2">Welcome to Marble</h1>
                <p className="text-gray-400 text-center text-sm mb-8">Begin by creating an account</p>
                
                <h2 className="text-lg font-medium text-white mb-4">Select your interests</h2>
                <p className="text-gray-400 text-sm mb-6">We&apos;ll recommend top websites based on the topics you select.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
                  {INTEREST_CATEGORIES.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedInterests.includes(interest)
                          ? 'bg-white text-black font-medium'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={selectedInterests.length === 0}
                  className={`w-full py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                    selectedInterests.length > 0
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div className="p-8">
                <SiteStackLogo />
                
                <h1 className="text-2xl font-medium text-white text-center mb-2">Recommended Websites</h1>
                <p className="text-gray-400 text-center text-sm mb-8">
                  Select websites you find interesting for your project
                </p>
                
                <div className="space-y-4 mb-8">
                  {recommendedWebsites.map((website) => (
                    <div 
                      key={website.name}
                      onClick={() => toggleWebsite(website.name)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedWebsites.includes(website.name)
                          ? 'bg-white/10 border border-white/30'
                          : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">{website.name}</h3>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          selectedWebsites.includes(website.name)
                            ? 'bg-white text-black'
                            : 'border border-gray-600'
                        }`}>
                          {selectedWebsites.includes(website.name) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{website.url}</p>
                      <p className="text-gray-500 text-xs mt-2">{website.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-lg text-base font-medium hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={completeOnboarding}
                    className="flex-1 py-3 px-4 bg-white text-black rounded-lg text-base font-medium hover:bg-gray-200 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}