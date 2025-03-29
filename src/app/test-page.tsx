'use client';

import { useState } from 'react';

export default function TestPage() {
  const [counter, setCounter] = useState(0);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Test Page</h1>
      <p className="text-xl mb-4">This is a simple test page to check if content loads properly.</p>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Counter: {counter}</h2>
        <button 
          onClick={() => setCounter(counter + 1)}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
        >
          Increment
        </button>
        <button 
          onClick={() => setCounter(0)}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
} 