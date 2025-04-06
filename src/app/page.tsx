"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MainHeader } from "@/components/main-header";
import { CroppedImage } from "@/components/ui/cropped-image";

// Video Demo Modal Component
const VideoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl max-w-4xl w-full mx-4 overflow-hidden shadow-2xl">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-xl font-semibold">Video Demo</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-full aspect-video bg-muted/40 rounded-lg flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-center text-muted-foreground mb-4">Video coming soon! Our team is currently working on an amazing demo video.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Video Demo Modal */}
      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
      
      {/* Header/Navigation */}
      <MainHeader />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-28 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left side text content */}
            <div className="w-full lg:w-1/2 space-y-6 text-left">
              {/* Small loader line */}
              <div className="w-16 h-1 bg-primary/30 mb-6"></div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground normal-case tracking-tight animate-fade-in">
                Discover and share
                <br />
                beautiful digital experiences
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl mt-6">
                Join our growing community of world-class designers and developers. Access over
                10,000 premiere digital screens, components, and videos — with new content added weekly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  size="lg" 
                  variant="default" 
                  className="rounded-full bg-black/80 text-white hover:bg-black px-8 h-12"
                  asChild
                >
                  <Link href="/login">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Get started
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full border-primary/40 text-foreground bg-background/10 hover:bg-background/20 hover:border-primary px-8 h-12 flex items-center gap-2 backdrop-blur-sm"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Video demo
                </Button>
              </div>
            </div>
            
            {/* Right side image grid - MasterClass style collage */}
            <div className="w-full lg:w-1/2 relative h-[600px] sm:h-[700px] md:h-[750px] overflow-hidden">
              {/* Overlay gradient for smoother transition at top/bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-20 pointer-events-none"></div>
              
              {/* Images container with infinite scroll animation */}
              <div className="absolute inset-0 animate-infinite-scroll">
                {/* First column - right */}
                <div className="absolute right-[5%] top-[0px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 0.png" 
                    alt="iOS Screen 1" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                <div className="absolute right-[5%] top-[460px] sm:top-[500px] md:top-[560px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 2.png" 
                    alt="iOS Screen 3" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                <div className="absolute right-[5%] top-[920px] sm:top-[1000px] md:top-[1120px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 4.png" 
                    alt="iOS Screen 5" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>

                <div className="absolute right-[5%] top-[1380px] sm:top-[1500px] md:top-[1680px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 6.png" 
                    alt="iOS Screen 7" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                {/* Repeat first column images for seamless loop */}
                <div className="absolute right-[5%] top-[1840px] sm:top-[2000px] md:top-[2240px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 0.png" 
                    alt="iOS Screen 1 (repeated)" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                {/* Second column - left */}
                <div className="absolute left-[5%] top-[30px] sm:top-[40px] md:top-[60px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 1.png" 
                    alt="iOS Screen 2" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                <div className="absolute left-[5%] top-[490px] sm:top-[540px] md:top-[620px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 3.png" 
                    alt="iOS Screen 4" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                <div className="absolute left-[5%] top-[950px] sm:top-[1040px] md:top-[1180px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 5.png" 
                    alt="iOS Screen 6" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                <div className="absolute left-[5%] top-[1410px] sm:top-[1540px] md:top-[1740px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 7.png" 
                    alt="iOS Screen 8" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
                
                {/* Repeat second column images for seamless loop */}
                <div className="absolute left-[5%] top-[1870px] sm:top-[2040px] md:top-[2300px] w-[40%] sm:w-[38%] max-w-[280px] h-[450px] sm:h-[490px] md:h-[540px] overflow-hidden rounded-lg shadow-md">
                  <CroppedImage 
                    src="/iOS Screens/iOS Screens 1.png" 
                    alt="iOS Screen 2 (repeated)" 
                    className="w-full h-full"
                    preserveAspectRatio={true}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Curated by section - MasterClass style */}
          <div className="flex justify-end items-center mt-10 text-muted-foreground opacity-70">
            <span className="mr-3">curated by</span>
            <span className="font-bold text-lg">Marble</span>
          </div>
        </div>
      </section>

      {/* How Marble Works Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How Marble Works</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-16">
            Our AI-powered platform analyzes top websites in your industry to help you build a site 
            that stands out.
          </p>

          {/* Divider */}
          <div className="w-16 h-0.5 bg-border mx-auto mb-20"></div>
          
          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-background rounded-2xl shadow-sm p-8">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-6">
                <span className="text-xl font-semibold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Tell us about your business</h3>
              <p className="text-muted-foreground">
                Share your industry, goals, and target audience so we can find the 
                most relevant sites to analyze.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-background rounded-2xl shadow-sm p-8">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-6">
                <span className="text-xl font-semibold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Analyze competitors</h3>
              <p className="text-muted-foreground">
                Our AI examines top sites in your field, identifying winning design 
                patterns and features.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-background rounded-2xl shadow-sm p-8">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-6">
                <span className="text-xl font-semibold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create your custom site</h3>
              <p className="text-muted-foreground">
                Get a beautiful website that incorporates the best elements 
                from industry leaders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section className="py-24 overflow-hidden bg-[#eeece9]">
        <div className="container mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-2/3 z-10">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">Powerful Features</h2>
              <p className="text-lg text-gray-800 max-w-2xl mb-16">
                Everything you need to create a website that outperforms your competition.
              </p>
              
              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">AI-Powered Analysis</h3>
                  <p className="text-gray-700 mb-4">
                    Our advanced AI scans and analyzes competitor websites to identify what makes them successful.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Design Inspiration</h3>
                  <p className="text-gray-700 mb-4">
                    Get insights into color schemes, layouts, and design elements that resonate with your audience.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Content Strategy</h3>
                  <p className="text-gray-700 mb-4">
                    Learn how top performers structure their content for maximum engagement and conversion.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Feature 4 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Performance Metrics</h3>
                  <p className="text-gray-700 mb-4">
                    Understand the technical aspects that affect site speed and user experience.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Feature 5 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Feature Comparison</h3>
                  <p className="text-gray-700 mb-4">
                    See what features your competitors offer and identify opportunities to differentiate.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Feature 6 */}
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Customizable Templates</h3>
                  <p className="text-gray-700 mb-4">
                    Start with templates inspired by top sites in your industry and make them your own.
                  </p>
                  <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Landing Sketch Image */}
            <div className="w-full lg:w-1/3 mt-12 lg:mt-0 lg:absolute lg:right-4 xl:right-8 lg:top-1/2 lg:transform lg:-translate-y-1/2 opacity-50 lg:opacity-80">
              <img 
                src="/images/landing_sketch.png" 
                alt="Website Design Sketch" 
                className="w-full max-w-md mx-auto lg:max-w-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 mt-24">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="font-bold text-xl mb-4">Marble</div>
              <p className="text-muted-foreground max-w-xs">
                Discover and share beautiful digital experiences from around the web.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Marble. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
