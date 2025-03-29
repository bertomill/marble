'use client';

export default function SampleVideo() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Sample Video Test</h1>
      
      <div className="max-w-3xl mx-auto">
        <p className="mb-4">Testing with a sample video from an external source:</p>
        
        <video 
          controls
          width="100%" 
          className="mb-8 border border-gray-700"
        >
          <source src="/video/sample.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h2 className="text-xl font-bold mb-2">Debug Info:</h2>
          <p>Video path: /video/sample.mp4</p>
          <p>This is a standard MP4 file downloaded from learningcontainer.com</p>
        </div>
        
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
  );
} 