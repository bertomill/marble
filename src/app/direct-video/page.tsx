'use client';

export default function DirectVideo() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Direct Video Test</h1>
      
      <div className="max-w-3xl mx-auto">
        <p className="mb-4">Testing video with direct HTML:</p>
        
        {/* Using dangerouslySetInnerHTML to render pure HTML video tag */}
        <div 
          className="my-8 border border-gray-700 p-4"
          dangerouslySetInnerHTML={{
            __html: `
              <video controls width="100%" poster="/images/dark-hero-bg.jpg">
                <source src="/videos/test.mp4" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            `
          }}
        />
        
        <div className="mt-8">
          <p>Check browser console for errors.</p>
          <p>Video path: /videos/test.mp4</p>
          
          <div className="mt-8">
            <a 
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 