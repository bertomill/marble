export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Blog</h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Latest insights, tips, and stories about web design and development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold px-4 text-center">How to Analyze Your Competitors&apos; Websites</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">May 15, 2024 • 8 min read</p>
                <p className="text-gray-700 mb-4">
                  Learn how to effectively analyze your competitors&apos; websites to gain valuable insights for your own design strategy.
                </p>
                <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">
                  Read More →
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-teal-400 opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold px-4 text-center">10 Web Design Trends to Watch in 2024</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">May 3, 2024 • 6 min read</p>
                <p className="text-gray-700 mb-4">
                  Stay ahead of the curve with these 10 emerging web design trends that are shaping the digital landscape in 2024.
                </p>
                <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">
                  Read More →
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-500 opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold px-4 text-center">The Psychology of Color in Web Design</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">April 22, 2024 • 5 min read</p>
                <p className="text-gray-700 mb-4">
                  Discover how different colors affect user perception and behavior, and how to use this knowledge in your website design.
                </p>
                <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">
                  Read More →
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold px-4 text-center">Building Accessible Websites: A Complete Guide</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">April 10, 2024 • 10 min read</p>
                <p className="text-gray-700 mb-4">
                  Learn best practices for creating websites that are accessible to all users, including those with disabilities.
                </p>
                <a href="#" className="text-indigo-600 font-medium hover:text-indigo-500">
                  Read More →
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Load More Articles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 