'use client';

export default function SimplePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-6">Very Simple Page</h1>
      <p className="text-xl mb-4">This page has no external dependencies or scripts.</p>
      
      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Static Content</h2>
        <p>If you can see this page, basic content loading is working correctly.</p>
        <p>The issue might be with specific external scripts or content.</p>
      </div>
    </div>
  );
} 