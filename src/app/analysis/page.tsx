'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { competitorAPI } from '@/services/api';

// Interface for tech stack information
interface TechStack {
  frontend: string[];
  backend: string[];
  frameworks: string[];
  analytics: string[];
  hosting: string[];
  ecommerce: string[];
  cms: string[];
}

// Interface for design information
interface DesignInfo {
  colors: string[];
  fonts: string[];
  layout: string;
  responsiveness: string;
}

// Interface for SEO information
interface SEOInfo {
  title: string;
  meta_description: string;
  meta_keywords: string;
  h1_count: number;
  image_alt_percentage: number;
  has_sitemap: boolean;
  issues: string[];
}

// Interface for performance information
interface PerformanceInfo {
  load_time: number;
  dom_content_loaded: number;
  resources_count: number;
  resources_size: number;
  score: string;
}

// Enhanced competitor interface with analysis data
interface Competitor {
  id: number;
  name: string;
  url: string;
  description: string;
  jobId: string;
  status: string;
  screenshots?: {
    homepage?: string;
    about?: string;
    products?: string;
  };
  techStack?: TechStack;
  design?: DesignInfo;
  seo?: SEOInfo;
  performance?: PerformanceInfo;
}

// API response interface
interface CompetitorResponse {
  name?: string;
  url?: string;
  description?: string;
  competitiveReason?: string;
  jobId?: string;
  status?: string;
}

// Analysis status response 
interface AnalysisStatusResponse {
  [key: string]: {
    status: string;
    message?: string;
    results?: {
      url: string;
      screenshots?: {
        homepage: string;
        about?: string;
        products?: string;
      };
      techStack: TechStack;
      design: DesignInfo;
      seo: SEOInfo;
      performance: PerformanceInfo;
    }
  }
}

// Helper function to generate a plausible domain from company name
function generateDomainFromName(name: string): string {
  if (!name) return '';
  
  // Remove special characters, convert to lowercase.
  const domainName = name.toLowerCase()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
    .replace(/\s+/g, '');
  
  // Add common TLDs based on length (just for variety).
  const tlds = ['.com', '.co', '.io', '.net', '.org'];
  const tld = tlds[Math.floor(Math.random() * tlds.length)];
  
  return domainName + tld;
}

export default function MinimalAnalysisPage() {
  // Use state to track loading status.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Load data on client-side only.
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        setIsLoading(true);
        
        // Get business info from session storage.
        let businessInfo: Record<string, string | string[]> = {};
        
        try {
          const storedInfo = sessionStorage.getItem('businessInfo');
          if (storedInfo) {
            businessInfo = JSON.parse(storedInfo);
            console.log('Retrieved business info from session storage:', businessInfo);
          } else {
            console.warn('No business info found in session storage');
          }
        } catch (err) {
          console.error("Error reading from session storage:", err);
        }
        
        // Generate fallback data based on available business info
        const getFallbackCompetitors = () => {
          console.log('Generating fallback competitors');
          const industry = 
            typeof businessInfo.industry === 'string' ? businessInfo.industry : 
            typeof businessInfo.businessType === 'string' ? businessInfo.businessType : 
            typeof businessInfo.businessNature === 'string' ? businessInfo.businessNature : 
            'business';
            
          return Array(5).fill(0).map((_, i) => ({
            id: i,
            name: `${industry} ${['Solutions', 'Provider', 'Global', 'Express', 'Leader'][i]}`,
            url: `https://example-${i}.com`,
            description: `Example ${industry} competitor with innovative solutions`,
            jobId: `job_${i}_fallback`,
            status: 'completed'
          }));
        };
        
        // Call API with the full business info
        let competitorData: CompetitorResponse[] = [];
        
        try {
          console.log('Calling competitor API with business info...');
          const response = await competitorAPI.findCompetitors(businessInfo);
          
          // Extract competitors
          if (response.competitors && Array.isArray(response.competitors)) {
            competitorData = response.competitors;
          } else if (Array.isArray(response)) {
            competitorData = response;
          } else {
            console.warn('Invalid response format from the server, using fallback data');
            competitorData = getFallbackCompetitors();
          }
        } catch (apiError) {
          console.error("API error when finding competitors:", apiError);
          // Use fallback data instead of failing
          competitorData = getFallbackCompetitors();
        }
        
        if (competitorData.length === 0) {
          console.warn('No competitors found, using fallback data');
          competitorData = getFallbackCompetitors();
        }
        
        // Map to enhanced format with URL validation
        const formattedCompetitors: Competitor[] = competitorData.map((comp: CompetitorResponse, index: number) => {
          // Generate a plausible URL if none provided
          let url = comp.url || '';
          
          if (!url || url === '#') {
            // Generate a plausible URL from the company name
            const generatedDomain = generateDomainFromName(comp.name || `competitor${index}`);
            url = generatedDomain ? `https://www.${generatedDomain}` : '#';
          } else if (!url.startsWith('http')) {
            // Ensure URL has http/https prefix for clickability
            url = 'https://' + url;
          }
          
          return {
            id: index,
            name: comp.name || `Competitor ${index + 1}`,
            url: url,
            description: comp.description || 'No description available',
            jobId: comp.jobId || '',
            status: comp.status || 'pending'
          };
        });
        
        setCompetitors(formattedCompetitors);
        setIsLoading(false);
        
        // Start polling for analysis status
        startPolling(formattedCompetitors);
      } catch (err) {
        console.error("Error analyzing competitors:", err);
        setError(err instanceof Error ? err.message : 'An error occurred during analysis');
        setIsLoading(false);
      }
    };
    
    // Start polling for analysis status
    const startPolling = (competitors: Competitor[]) => {
      // Clear any existing interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Start polling for analysis status every 5 seconds
      const interval = setInterval(async () => {
        try {
          // Collect all job IDs for polling
          const jobIds = competitors.map(comp => comp.jobId).filter(Boolean);
          
          if (jobIds.length === 0) {
            clearInterval(interval);
            return;
          }
          
          // Poll for status updates
          const statusResponse: AnalysisStatusResponse = await competitorAPI.getAnalysisStatus(jobIds);
          
          // Update competitors with analysis results
          setCompetitors(prevCompetitors => {
            const updatedCompetitors = [...prevCompetitors];
            let allCompleted = true;
            
            for (const comp of updatedCompetitors) {
              if (comp.jobId && statusResponse[comp.jobId]) {
                const status = statusResponse[comp.jobId];
                comp.status = status.status;
                
                // If analysis is complete, update with results
                if (status.status === 'completed' && status.results) {
                  comp.screenshots = status.results.screenshots;
                  comp.techStack = status.results.techStack;
                  comp.design = status.results.design;
                  comp.seo = status.results.seo;
                  comp.performance = status.results.performance;
                }
                
                // Check if all analyses are complete
                if (status.status !== 'completed') {
                  allCompleted = false;
                }
              }
            }
            
            // If all competitors are analyzed, stop polling
            if (allCompleted) {
              clearInterval(interval);
              setPollingInterval(null);
            }
            
            return updatedCompetitors;
          });
        } catch (err) {
          console.error("Error polling for analysis status:", err);
        }
      }, 5000);
      
      setPollingInterval(interval);
    };
    
    // Delay execution to ensure client-side only
    const timer = setTimeout(() => {
      fetchCompetitors();
    }, 100);
    
    // Cleanup on component unmount
    return () => {
      clearTimeout(timer);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
  
  // Open competitor details modal
  const openCompetitorDetails = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setActiveTab("overview");
  };
  
  // Close competitor details modal
  const closeCompetitorDetails = () => {
    setSelectedCompetitor(null);
  };
  
  return (
    <div className="min-h-screen p-6 sm:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-white">Analyzing Top Competitors</h1>
          <p className="text-neutral-300 mt-2">Finding and analyzing competitors in your industry</p>
        </div>
        
        {/* Content */}
        <div className="bg-[#2a2545] rounded-lg shadow-md p-4 sm:p-6 border border-[#352f57]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                <p className="text-neutral-300">Finding and analyzing competitors...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {competitors.map((competitor) => (
                  <div 
                    key={competitor.id} 
                    className="border border-[#352f57] rounded-lg p-4 bg-[#1e1a36] cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={() => openCompetitorDetails(competitor)}
                  >
                    <h3 className="text-white font-medium">{competitor.name}</h3>
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-400 hover:text-blue-300 truncate mt-1 block"
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                    >
                      {competitor.url}
                    </a>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-2">{competitor.description}</p>
                    
                    {/* Analysis Status */}
                    <div className="flex justify-between items-center mt-3">
                      {competitor.status === 'completed' ? (
                        <div className="inline-block px-2 py-1 bg-indigo-900/30 rounded-md">
                          <span className="text-xs text-green-400">Analysis complete</span>
                        </div>
                      ) : competitor.status === 'processing' ? (
                        <div className="inline-block px-2 py-1 bg-indigo-900/30 rounded-md">
                          <span className="text-xs text-yellow-400">Analyzing...</span>
                        </div>
                      ) : (
                        <div className="inline-block px-2 py-1 bg-indigo-900/30 rounded-md">
                          <span className="text-xs text-blue-400">Queued</span>
                        </div>
                      )}
                      
                      <a 
                        href={competitor.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 rounded-md text-xs transition-colors"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking visit
                      >
                        Visit Website
                      </a>
                    </div>
                    
                    {/* Preview if screenshot is available */}
                    {competitor.screenshots && (
                      <div className="mt-3 pt-3 border-t border-[#352f57]">
                        <div className="h-24 overflow-hidden rounded-md relative">
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${competitor.screenshots.homepage}')` }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1e1a36] to-transparent h-8" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link
                  href="/generator"
                  className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Continue to Website Generator
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Competitor Details Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#2a2545] rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-[#2a2545] p-4 border-b border-[#352f57] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedCompetitor.name}</h2>
              <button 
                onClick={closeCompetitorDetails}
                className="text-neutral-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {/* Status indicator */}
              {selectedCompetitor.status !== 'completed' ? (
                <div className="text-center py-8">
                  <p className="text-neutral-300 mb-2">
                    {selectedCompetitor.status === 'processing' 
                      ? 'Analysis in progress...' 
                      : 'Waiting to start analysis...'}
                  </p>
                  <div className="animate-pulse bg-indigo-600/30 h-2 w-48 mx-auto rounded"></div>
                </div>
              ) : (
                <div>
                  {/* Tabs navigation */}
                  <div className="flex border-b border-[#352f57] mb-6 overflow-x-auto">
                    <button
                      className={`px-4 py-2 ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTab === 'tech' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('tech')}
                    >
                      Tech Stack
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTab === 'screenshots' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('screenshots')}
                    >
                      Screenshots
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTab === 'seo' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('seo')}
                    >
                      SEO
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTab === 'design' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('design')}
                    >
                      Design
                    </button>
                    <button
                      className={`px-4 py-2 ${activeTab === 'performance' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-neutral-400 hover:text-white'}`}
                      onClick={() => setActiveTab('performance')}
                    >
                      Performance
                    </button>
                  </div>
                  
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left column - Screenshot */}
                      <div className="lg:col-span-2">
                        <div className="rounded-lg overflow-hidden border border-[#352f57] mb-4">
                          {selectedCompetitor.screenshots && selectedCompetitor.screenshots.homepage ? (
                            <div
                              className="w-full h-80 bg-cover bg-top"
                              style={{ backgroundImage: `url('${selectedCompetitor.screenshots.homepage}')` }}
                            />
                          ) : (
                            <div className="w-full h-80 bg-[#1e1a36] flex items-center justify-center">
                              <p className="text-neutral-400">No screenshot available</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4 mb-4">
                          <h3 className="text-white font-medium mb-2">About</h3>
                          <p className="text-neutral-300 text-sm">{selectedCompetitor.description}</p>
                          <div className="mt-4">
                            <a 
                              href={selectedCompetitor.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-1 bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 rounded-md text-sm transition-colors"
                            >
                              Visit Website
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column - Tech & Design */}
                      <div className="space-y-4">
                        {/* Key stats */}
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">Key Stats</h3>
                          
                          {selectedCompetitor.performance && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Performance</span>
                                <span className={`
                                  ${selectedCompetitor.performance.score === 'Excellent' ? 'text-green-400' : ''}
                                  ${selectedCompetitor.performance.score === 'Good' ? 'text-blue-400' : ''}
                                  ${selectedCompetitor.performance.score === 'Average' ? 'text-yellow-400' : ''}
                                  ${selectedCompetitor.performance.score === 'Slow' ? 'text-red-400' : ''}
                                  ${selectedCompetitor.performance.score === 'Unknown' ? 'text-neutral-400' : ''}
                                `}>
                                  {selectedCompetitor.performance.score}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {selectedCompetitor.seo && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">SEO Issues</span>
                                <span className={`
                                  ${selectedCompetitor.seo.issues.length === 0 ? 'text-green-400' : ''}
                                  ${selectedCompetitor.seo.issues.length > 0 && selectedCompetitor.seo.issues.length <= 2 ? 'text-blue-400' : ''}
                                  ${selectedCompetitor.seo.issues.length > 2 && selectedCompetitor.seo.issues.length <= 4 ? 'text-yellow-400' : ''}
                                  ${selectedCompetitor.seo.issues.length > 4 ? 'text-red-400' : ''}
                                `}>
                                  {selectedCompetitor.seo.issues.length} {selectedCompetitor.seo.issues.length === 1 ? 'issue' : 'issues'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {selectedCompetitor.techStack && (
                            <div>
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Technologies</span>
                                <span className="text-indigo-400">
                                  {Object.values(selectedCompetitor.techStack).flat().length} detected
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Tech Stack Highlights */}
                        {selectedCompetitor.techStack && (
                          <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                            <h3 className="text-white font-medium mb-3">Technology Highlights</h3>
                            <div className="space-y-2">
                              {selectedCompetitor.techStack.frontend.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCompetitor.techStack.frontend.slice(0, 3).map((tech: string, index: number) => (
                                    <span 
                                      key={index}
                                      className="inline-block px-2 py-1 bg-indigo-900/30 rounded-md text-xs text-indigo-300"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {selectedCompetitor.techStack.cms.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCompetitor.techStack.cms.slice(0, 2).map((tech: string, index: number) => (
                                    <span 
                                      key={index}
                                      className="inline-block px-2 py-1 bg-blue-900/30 rounded-md text-xs text-blue-300"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {selectedCompetitor.techStack.ecommerce.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {selectedCompetitor.techStack.ecommerce.slice(0, 2).map((tech: string, index: number) => (
                                    <span 
                                      key={index}
                                      className="inline-block px-2 py-1 bg-green-900/30 rounded-md text-xs text-green-300"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#352f57] text-center">
                              <button
                                onClick={() => setActiveTab('tech')}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                              >
                                See all technologies →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tech Stack Tab */}
                  {activeTab === 'tech' && selectedCompetitor.techStack && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(selectedCompetitor.techStack).map(([category, technologies]) => (
                        technologies.length > 0 && (
                          <div key={category} className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                            <h3 className="text-white font-medium mb-3 capitalize">{category.replace('_', ' ')}</h3>
                            <div className="flex flex-wrap gap-2">
                              {technologies.map((tech: string, index: number) => (
                                <span 
                                  key={index}
                                  className="inline-block px-2 py-1 bg-indigo-900/30 rounded-md text-xs text-indigo-300"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  
                  {/* Screenshots Tab */}
                  {activeTab === 'screenshots' && selectedCompetitor.screenshots && (
                    <div className="space-y-8">
                      {selectedCompetitor.screenshots.homepage && (
                        <div>
                          <h3 className="text-white font-medium mb-3">Homepage</h3>
                          <div className="border border-[#352f57] rounded-lg overflow-hidden">
                            <div
                              className="w-full h-96 bg-cover bg-top"
                              style={{ backgroundImage: `url('${selectedCompetitor.screenshots.homepage}')` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {selectedCompetitor.screenshots.about && (
                        <div>
                          <h3 className="text-white font-medium mb-3">About Page</h3>
                          <div className="border border-[#352f57] rounded-lg overflow-hidden">
                            <div
                              className="w-full h-96 bg-cover bg-top"
                              style={{ backgroundImage: `url('${selectedCompetitor.screenshots.about}')` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {selectedCompetitor.screenshots.products && (
                        <div>
                          <h3 className="text-white font-medium mb-3">Products/Services Page</h3>
                          <div className="border border-[#352f57] rounded-lg overflow-hidden">
                            <div
                              className="w-full h-96 bg-cover bg-top"
                              style={{ backgroundImage: `url('${selectedCompetitor.screenshots.products}')` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {(!selectedCompetitor.screenshots.homepage && 
                        !selectedCompetitor.screenshots.about && 
                        !selectedCompetitor.screenshots.products) && (
                        <div className="text-center py-8">
                          <p className="text-neutral-400">No screenshots available</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* SEO Tab */}
                  {activeTab === 'seo' && selectedCompetitor.seo && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">Meta Information</h3>
                          
                          <div className="mb-3">
                            <h4 className="text-neutral-400 text-xs uppercase mb-1">Page Title</h4>
                            <p className="text-neutral-300 text-sm bg-[#252043] p-2 rounded">
                              {selectedCompetitor.seo.title || "None detected"}
                            </p>
                            {selectedCompetitor.seo.title && 
                              <div className="mt-1 flex justify-between text-xs">
                                <span>Length:</span>
                                <span className={`${selectedCompetitor.seo.title.length > 60 ? 'text-red-400' : 'text-green-400'}`}>
                                  {selectedCompetitor.seo.title.length} chars
                                </span>
                              </div>
                            }
                          </div>
                          
                          <div>
                            <h4 className="text-neutral-400 text-xs uppercase mb-1">Meta Description</h4>
                            <p className="text-neutral-300 text-sm bg-[#252043] p-2 rounded">
                              {selectedCompetitor.seo.meta_description || "None detected"}
                            </p>
                            {selectedCompetitor.seo.meta_description && 
                              <div className="mt-1 flex justify-between text-xs">
                                <span>Length:</span>
                                <span className={`
                                  ${selectedCompetitor.seo.meta_description.length < 50 ? 'text-red-400' : ''}
                                  ${selectedCompetitor.seo.meta_description.length > 160 ? 'text-red-400' : ''}
                                  ${selectedCompetitor.seo.meta_description.length >= 50 && selectedCompetitor.seo.meta_description.length <= 160 ? 'text-green-400' : ''}
                                `}>
                                  {selectedCompetitor.seo.meta_description.length} chars
                                </span>
                              </div>
                            }
                          </div>
                        </div>
                        
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">SEO Metrics</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">H1 Tags</span>
                                <span className={`text-sm ${selectedCompetitor.seo.h1_count === 1 ? 'text-green-400' : 'text-red-400'}`}>
                                  {selectedCompetitor.seo.h1_count}
                                </span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${selectedCompetitor.seo.h1_count === 1 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${selectedCompetitor.seo.h1_count > 0 ? 100 : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">Image Alt Text</span>
                                <span className={`text-sm ${selectedCompetitor.seo.image_alt_percentage >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {selectedCompetitor.seo.image_alt_percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    selectedCompetitor.seo.image_alt_percentage >= 80 ? 'bg-green-500' : 
                                    selectedCompetitor.seo.image_alt_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${selectedCompetitor.seo.image_alt_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">Sitemap</span>
                                <span className={`text-sm ${selectedCompetitor.seo.has_sitemap ? 'text-green-400' : 'text-red-400'}`}>
                                  {selectedCompetitor.seo.has_sitemap ? 'Found' : 'Not found'}
                                </span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${selectedCompetitor.seo.has_sitemap ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: selectedCompetitor.seo.has_sitemap ? '100%' : '0%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedCompetitor.seo.issues.length > 0 && (
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">SEO Issues</h3>
                          <ul className="space-y-2">
                            {selectedCompetitor.seo.issues.map((issue: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-400 mr-2">•</span>
                                <span className="text-neutral-300 text-sm">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Design Tab */}
                  {activeTab === 'design' && selectedCompetitor.design && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Colors */}
                      <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                        <h3 className="text-white font-medium mb-3">Color Scheme</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {selectedCompetitor.design.colors.map((color, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="w-full aspect-square rounded mb-1 border border-white/20"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-neutral-400 text-xs">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Typography */}
                      <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                        <h3 className="text-white font-medium mb-3">Typography</h3>
                        <div className="space-y-3">
                          {selectedCompetitor.design.fonts.map((font, index) => (
                            <div key={index} className="p-2 bg-[#252043] rounded">
                              <p className="text-white text-sm">{font}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Layout & Responsiveness */}
                      <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                        <h3 className="text-white font-medium mb-3">Layout & Responsiveness</h3>
                        <div className="mb-3">
                          <h4 className="text-neutral-400 text-xs uppercase mb-1">Layout</h4>
                          <p className="text-neutral-300 text-sm">{selectedCompetitor.design.layout}</p>
                        </div>
                        <div>
                          <h4 className="text-neutral-400 text-xs uppercase mb-1">Responsiveness</h4>
                          <p className="text-neutral-300 text-sm">{selectedCompetitor.design.responsiveness}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Performance Tab */}
                  {activeTab === 'performance' && selectedCompetitor.performance && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4 flex flex-col items-center justify-center">
                          <div className={`
                            rounded-full w-24 h-24 flex items-center justify-center mb-3
                            ${selectedCompetitor.performance.score === 'Excellent' ? 'bg-green-900/30 text-green-400' : ''}
                            ${selectedCompetitor.performance.score === 'Good' ? 'bg-blue-900/30 text-blue-400' : ''}
                            ${selectedCompetitor.performance.score === 'Average' ? 'bg-yellow-900/30 text-yellow-400' : ''}
                            ${selectedCompetitor.performance.score === 'Slow' ? 'bg-red-900/30 text-red-400' : ''}
                            ${selectedCompetitor.performance.score === 'Unknown' ? 'bg-neutral-900/30 text-neutral-400' : ''}
                          `}>
                            <span className="text-2xl font-bold">{selectedCompetitor.performance.score}</span>
                          </div>
                          <h3 className="text-white font-medium">Overall Score</h3>
                        </div>
                        
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">Load Times</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">Page Load Time</span>
                                <span className="text-sm">{(selectedCompetitor.performance.load_time/1000).toFixed(2)}s</span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    selectedCompetitor.performance.load_time < 1000 ? 'bg-green-500' : 
                                    selectedCompetitor.performance.load_time < 2500 ? 'bg-blue-500' : 
                                    selectedCompetitor.performance.load_time < 5000 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (selectedCompetitor.performance.load_time/5000)*100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">DOM Content Loaded</span>
                                <span className="text-sm">{(selectedCompetitor.performance.dom_content_loaded/1000).toFixed(2)}s</span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    selectedCompetitor.performance.dom_content_loaded < 800 ? 'bg-green-500' : 
                                    selectedCompetitor.performance.dom_content_loaded < 1500 ? 'bg-blue-500' : 
                                    selectedCompetitor.performance.dom_content_loaded < 3000 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (selectedCompetitor.performance.dom_content_loaded/3000)*100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border border-[#352f57] rounded-lg bg-[#1e1a36] p-4">
                          <h3 className="text-white font-medium mb-3">Resource Usage</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">Resource Count</span>
                                <span className="text-sm">{selectedCompetitor.performance.resources_count} files</span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    selectedCompetitor.performance.resources_count > 0 ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: selectedCompetitor.performance.resources_count > 0 ? '100%' : '0%' }}
                                ></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-neutral-400 text-sm">Resource Size</span>
                                <span className="text-sm">{selectedCompetitor.performance.resources_size} bytes</span>
                              </div>
                              <div className="w-full bg-[#252043] rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    selectedCompetitor.performance.resources_size > 0 ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: selectedCompetitor.performance.resources_size > 0 ? '100%' : '0%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 