'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for search results (friends)
const mockSearchResults = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', imageSrc: null },
  { id: 2, name: 'Sam Parker', email: 'sam@example.com', imageSrc: null },
  { id: 3, name: 'Taylor Smith', email: 'taylor@example.com', imageSrc: null },
  { id: 4, name: 'Jordan Lee', email: 'jordan@example.com', imageSrc: null },
  { id: 5, name: 'Casey Brown', email: 'casey@example.com', imageSrc: null }
];

export default function SearchPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = searchTerm 
    ? mockSearchResults.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mockSearchResults;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
      
      <div className="bg-[#1a1625] rounded-lg shadow-lg border border-[#352f57] overflow-hidden mb-8">
        <div className="p-5 border-b border-[#352f57]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search friends"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2545] text-white placeholder-gray-400 border border-[#352f57] rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">
            {searchTerm ? 'Search Results' : 'Recent Searches'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map(result => (
              <div key={result.id} className="flex items-center p-3 hover:bg-[#2a2545] rounded-lg transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {result.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">{result.name}</div>
                  <div className="text-xs text-gray-400">{result.email}</div>
                </div>
              </div>
            ))}
          </div>

          {filteredResults.length === 0 && (
            <div className="py-4 text-center text-gray-400">
              No results found
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-[#1a1625] rounded-lg shadow-lg border border-[#352f57] overflow-hidden">
        <div className="p-5 border-b border-[#352f57]">
          <h2 className="text-xl font-bold text-white">Invite Friends</h2>
        </div>
        <div className="p-5">
          <p className="text-gray-300 mb-4">
            Invite your friends to join SiteStack and collaborate on projects together.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter phone number or email"
                className="w-full bg-[#2a2545] text-white placeholder-gray-400 border border-[#352f57] rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              Invite Friend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
