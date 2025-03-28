'use client';

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero section with modern design */}
      <section className="relative min-h-screen bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Video background */}
          <video 
            className="absolute w-full h-full object-cover opacity-60 video-smooth"
            autoPlay 
            loop 
            muted 
            playsInline
            style={{ 
              transform: 'scale(1.1)'
            }}
            onError={(e) => {
              console.error('Error loading video:', e);
            }}
          >
            <source src="/videos/limestone_bg.mp4" type="video/mp4" />
            {/* Fallback message */}
            Your browser does not support the video tag.
          </video>
          
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

        <div className="container mx-auto px-6 relative z-10 pt-32">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              Discover and share application designs <span className="text-white">@Marble</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mt-6 max-w-2xl">
              Join a community of leading designers and top performers. Analyze, learn, and create.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a 
                href="/login?redirect=%2Fonboarding" 
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-medium rounded-lg hover:bg-gray-200 transition duration-300"
              >
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="/design-tools" 
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border border-white/20 text-white text-lg font-medium rounded-lg hover:bg-white/10 transition duration-300 backdrop-blur-sm"
              >
                Explore Tools
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works section with modern design */}
      <section className="py-20 bg-[#f5f5f0]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How Marble Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform analyzes top websites in your industry to help you build a site that stands out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#4bb1ff]/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-[#4bb1ff] text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Tell us about your business</h3>
              <p className="text-gray-600">
                Share your industry, goals, and target audience so we can find the most relevant sites to analyze.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#4bb1ff]/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-[#4bb1ff] text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Analyze competitors</h3>
              <p className="text-gray-600">
                Our AI examines top sites in your field, identifying winning design patterns and features.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#4bb1ff]/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-[#4bb1ff] text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Create your custom site</h3>
              <p className="text-gray-600">
                Get a beautiful website that incorporates the best elements from industry leaders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Powerful Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create a website that outperforms your competition.
            </p>
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
              <div key={index} className="bg-[#f5f5f0] p-8 rounded-xl">
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section with modern background */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
          
          {/* Animated gradient meshes */}
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-[10%] right-[15%] w-[40vw] h-[40vh] rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[15%] left-[10%] w-[35vw] h-[35vh] rounded-full bg-gradient-to-r from-pink-500/20 to-indigo-500/20 blur-[100px] animate-pulse-slower"></div>
          </div>
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          ></div>
          
          {/* Floating design elements */}
          <div className="absolute top-[25%] right-[25%] w-[120px] h-[120px] border border-white/10 rounded-full opacity-20 animate-float-slow"></div>
          <div className="absolute bottom-[30%] left-[20%] w-[80px] h-[80px] border border-white/10 rounded-full opacity-20 animate-float-slower"></div>
          
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-radial-gradient"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to build your next-generation website?</h2>
            <p className="text-xl text-gray-300 mb-10">
              Join thousands of businesses that use Marble to create websites that convert visitors into customers.
            </p>
            <a 
              href="/login?redirect=%2Fdashboard" 
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-black text-xl font-medium rounded-lg hover:bg-gray-200 transition duration-300"
            >
              Get Started For Free
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0c0c19] text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold text-white mb-4">Marble</h3>
              <p className="max-w-xs">Building better websites inspired by the best in your industry.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-2">
                  <li><a href="/features" className="hover:text-white transition">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
                  <li><a href="/design-tools" className="hover:text-white transition">Design Tools</a></li>
                  <li><a href="/competitors" className="hover:text-white transition">Competitor Analysis</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="hover:text-white transition">About Us</a></li>
                  <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
                  <li><a href="/careers" className="hover:text-white transition">Careers</a></li>
                  <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
                  <li><a href="/cookies" className="hover:text-white transition">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p> {new Date().getFullYear()} Marble. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
