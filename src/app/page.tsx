'use client';

import { useState, useEffect } from 'react';
import LangbaseHeader from '@/components/LangbaseHeader';

export default function Home() {
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
      <LangbaseHeader />
      
      {/* Hero section with modern design */}
      <section className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          {/* Video Background or Fallback Image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {!videoError ? (
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className={`absolute w-full h-full object-cover video-smooth ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
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
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10 z-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          ></div>
          
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-radial-gradient"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          {/* Logo with horizontal line style */}
          <div className="flex justify-center mb-16">
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="w-16 h-[10px] bg-gradient-to-r from-white/90 to-white/10 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-8 leading-tight animate-text-reveal">
            <span className="block">discover and share</span>
            <span className="block">beautiful digital experiences</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mt-8 max-w-3xl mx-auto animate-text-reveal" style={{ animationDelay: '0.5s' }}>
            Join our growing community of world-class designers and developers. Access over 10,000 premiere digital screens, 
            <br className="hidden md:block" />
            components, and videos — with new content added weekly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a 
              href="/login?redirect=%2Fonboarding" 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-medium rounded-lg hover:bg-gray-200 transition duration-300 animate-text-reveal"
              style={{ animationDelay: '0.9s' }}
            >
              Get started
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="/design-tools" 
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white text-lg font-medium rounded-lg hover:bg-white/10 transition duration-300 backdrop-blur-sm border border-white/20 animate-text-reveal"
              style={{ animationDelay: '1.1s' }}
            >
              Video demo
            </a>
          </div>
        </div>
      </section>

      {/* How It Works section with marble-inspired design */}
      <section className="py-20 bg-[#eae9e5] relative" style={{
        backgroundImage: `none`,
        backgroundSize: 'cover'
      }}>
        {/* Woman sketch as image */}
        <div className="absolute right-0 top-0 h-full w-full pointer-events-none overflow-hidden">
          <img 
            src="/images/woman_sketch.png" 
            alt="Artistic sketch" 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-[90%] object-contain opacity-100"
            style={{ 
              maxWidth: '50%'
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800">How Marble Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform analyzes top websites in your industry to help you build a site that stands out.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-300 to-gray-400 mx-auto mt-8" style={{
              backgroundImage: 'linear-gradient(to right, #d5d5d0, #e2e2dc, #d5d5d0)',
              borderRadius: '2px'
            }}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,250,248,0.9) 100%)',
            }}>
              <div className="w-14 h-14 bg-[#e8e8e2] rounded-full flex items-center justify-center mb-6" style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.05)'
              }}>
                <span className="text-[#4bb1ff] text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Tell us about your business</h3>
              <p className="text-gray-600">
                Share your industry, goals, and target audience so we can find the most relevant sites to analyze.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,250,248,0.9) 100%)',
            }}>
              <div className="w-14 h-14 bg-[#e8e8e2] rounded-full flex items-center justify-center mb-6" style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.05)'
              }}>
                <span className="text-[#4bb1ff] text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Analyze competitors</h3>
              <p className="text-gray-600">
                Our AI examines top sites in your field, identifying winning design patterns and features.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,250,248,0.9) 100%)',
            }}>
              <div className="w-14 h-14 bg-[#e8e8e2] rounded-full flex items-center justify-center mb-6" style={{
                boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.05)'
              }}>
                <span className="text-[#4bb1ff] text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Create your custom site</h3>
              <p className="text-gray-600">
                Get a beautiful website that incorporates the best elements from industry leaders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features section with marble accents */}
      <section className="py-20 bg-[#d8d6d2] relative overflow-hidden">
        {/* Random shapes sketch as image */}
        <div className="absolute left-0 top-0 h-full w-full pointer-events-none overflow-hidden">
          <img 
            src="/images/random_shape_sketches.png" 
            alt="Geometric sketches" 
            className="absolute left-0 top-[35%] transform -translate-y-1/2 h-[85%] object-contain opacity-100"
            style={{ 
              maxWidth: '42%',
              marginLeft: '-2%'
            }}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800">Powerful Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create a website that outperforms your competition.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-300 to-gray-400 mx-auto mt-8" style={{
              backgroundImage: 'linear-gradient(to right, #d5d5d0, #e2e2dc, #d5d5d0)',
              borderRadius: '2px'
            }}></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Analysis",
                description: "Our advanced AI scans and analyzes competitor websites to identify what makes them successful."
              },
              {
                title: "Design Inspiration",
                description: "Get insights into color schemes, layouts, and design elements that resonate with your audience."
              },
              {
                title: "Content Strategy",
                description: "Learn how top performers structure their content for maximum engagement and conversion."
              },
              {
                title: "Performance Metrics",
                description: "Understand the technical aspects that affect site speed and user experience."
              },
              {
                title: "Feature Comparison",
                description: "See what features your competitors offer and identify opportunities to differentiate."
              },
              {
                title: "Customizable Templates",
                description: "Start with templates inspired by top sites in your industry and make them your own."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl border border-[#ededea]" style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.9) 100%)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                <div className="w-10 h-10 mb-4 rounded-full bg-[#f8f8f5] flex items-center justify-center" style={{
                  border: '1px solid #ededea',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <span className="w-6 h-1 bg-gradient-to-r from-[#d0d0c8] to-[#e5e5e0]" style={{
                    borderRadius: '1px'
                  }}></span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section with marble-inspired background */}
      <section className="relative py-24 overflow-hidden bg-[#f5f5f0]">
        <div className="absolute inset-0 z-0">
          {/* Base gradient with marble texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0f0e8] via-[#f5f5f0] to-[#f0f0e8]"></div>
          
          {/* Marble texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url('/images/subtle-marble-texture.png')`,
            backgroundSize: 'cover',
            mixBlendMode: 'multiply'
          }}></div>
          
          {/* Veining effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[30%] left-[10%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent transform rotate-[-15deg]"></div>
            <div className="absolute top-[40%] left-[20%] w-[40%] h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent transform rotate-[-5deg]"></div>
            <div className="absolute top-[70%] right-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent transform rotate-[10deg]"></div>
          </div>
          
          {/* Animated gradient meshes with marble-like qualities */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-[15%] right-[20%] w-[35vw] h-[35vh] rounded-full bg-gradient-to-r from-[#e8e8e2]/30 to-[#f0f0e8]/30 blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[20%] left-[15%] w-[30vw] h-[30vh] rounded-full bg-gradient-to-r from-[#e2e2dc]/30 to-[#f0f0e8]/30 blur-[100px] animate-pulse-slower"></div>
          </div>
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          ></div>
          
          {/* Marble-like circular accents */}
          <div className="absolute top-[25%] right-[25%] w-[120px] h-[120px] border border-gray-300/20 rounded-full opacity-20 animate-float-slow"></div>
          <div className="absolute bottom-[30%] left-[20%] w-[80px] h-[80px] border border-gray-300/20 rounded-full opacity-20 animate-float-slower"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Ready to build your next-generation website?</h2>
            <p className="text-xl text-gray-600 mb-10">
              Join thousands of businesses that use Marble to create websites that convert visitors into customers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/login?redirect=%2Fdashboard" 
                className="inline-flex items-center justify-center px-10 py-5 bg-gray-800 text-white text-xl font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                Get Started For Free
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="/tour" 
                className="inline-flex items-center justify-center px-10 py-5 bg-transparent border border-gray-300 text-gray-700 text-xl font-medium rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Take a Tour
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with marble accents */}
      <footer className="bg-[#f0f0e8] text-gray-600 py-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Subtle marble texture overlay */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url('/images/subtle-marble-texture.png')`,
            backgroundSize: 'cover',
            mixBlendMode: 'multiply'
          }}></div>
          
          {/* Delicate marble veins */}
          <div className="absolute top-0 left-[10%] w-[40%] h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          <div className="absolute top-[30%] right-0 w-[30%] h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          <div className="absolute bottom-[20%] left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Marble</h3>
                <div className="ml-2 w-6 h-[2px] bg-gradient-to-r from-gray-400 to-gray-300 rounded-full"></div>
              </div>
              <p className="max-w-xs text-gray-600">Building better websites inspired by the best in your industry.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 inline-flex items-center">
                  Platform
                  <span className="ml-2 w-4 h-[1px] bg-gray-400 opacity-50"></span>
                </h4>
                <ul className="space-y-2">
                  <li><a href="/features" className="text-gray-600 hover:text-gray-800 transition">Features</a></li>
                  <li><a href="/pricing" className="text-gray-600 hover:text-gray-800 transition">Pricing</a></li>
                  <li><a href="/design-tools" className="text-gray-600 hover:text-gray-800 transition">Design Tools</a></li>
                  <li><a href="/competitors" className="text-gray-600 hover:text-gray-800 transition">Competitor Analysis</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 inline-flex items-center">
                  Company
                  <span className="ml-2 w-4 h-[1px] bg-gray-400 opacity-50"></span>
                </h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-gray-600 hover:text-gray-800 transition">About Us</a></li>
                  <li><a href="/blog" className="text-gray-600 hover:text-gray-800 transition">Blog</a></li>
                  <li><a href="/careers" className="text-gray-600 hover:text-gray-800 transition">Careers</a></li>
                  <li><a href="/contact" className="text-gray-600 hover:text-gray-800 transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 inline-flex items-center">
                  Legal
                  <span className="ml-2 w-4 h-[1px] bg-gray-400 opacity-50"></span>
                </h4>
                <ul className="space-y-2">
                  <li><a href="/privacy" className="text-gray-600 hover:text-gray-800 transition">Privacy Policy</a></li>
                  <li><a href="/terms" className="text-gray-600 hover:text-gray-800 transition">Terms of Service</a></li>
                  <li><a href="/cookies" className="text-gray-600 hover:text-gray-800 transition">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="flex items-center text-gray-500">
              <span className="w-3 h-[1px] bg-gray-400 mr-2"></span>
              © {new Date().getFullYear()} Marble. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-800 transition group">
                <span className="sr-only">Twitter</span>
                <div className="relative">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  <span className="absolute -inset-1 -z-10 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </div>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800 transition group">
                <span className="sr-only">GitHub</span>
                <div className="relative">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute -inset-1 -z-10 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </div>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-800 transition group">
                <span className="sr-only">LinkedIn</span>
                <div className="relative">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute -inset-1 -z-10 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
