'use client';

import { useState } from 'react';
import Image from 'next/image';

// Example data to simulate real competitor analysis
const EXAMPLE_COMPETITORS = [
  {
    id: 1,
    name: 'Shopify',
    url: 'https://shopify.com',
    category: 'E-commerce',
    screenshot: '/placeholder-hero.jpg',
    colors: ['#95BF47', '#5E8E3E', '#FFFFFF', '#212B35'],
    fonts: ['Helvetica Neue', 'sans-serif'],
    technologies: ['React', 'Ruby on Rails', 'Liquid', 'GraphQL'],
    features: ['Online store builder', 'Shopping cart', 'Payment processing', 'Mobile responsive'],
    strengths: ['Clean interface', 'Easy to navigate', 'Strong product presentation', 'Mobile optimized'],
  },
  {
    id: 2,
    name: 'Stripe',
    url: 'https://stripe.com',
    category: 'Fintech',
    screenshot: '/placeholder-hero.jpg',
    colors: ['#635BFF', '#0A2540', '#FFFFFF', '#BCE5FF'],
    fonts: ['Inter', 'sans-serif'],
    technologies: ['React', 'Ruby', 'Node.js', 'GraphQL'],
    features: ['Clean documentation', 'Interactive examples', 'Animated transitions', 'Developer focused'],
    strengths: ['Technical yet accessible', 'Beautiful animations', 'Clear information hierarchy', 'Engaging visuals'],
  },
  {
    id: 3,
    name: 'Airbnb',
    url: 'https://airbnb.com',
    category: 'Travel',
    screenshot: '/placeholder-hero.jpg',
    colors: ['#FF5A5F', '#00A699', '#FFFFFF', '#484848'],
    fonts: ['Circular', 'sans-serif'],
    technologies: ['React', 'Node.js', 'Express', 'Redux'],
    features: ['Search filters', 'Map integration', 'Photo galleries', 'Reviews'],
    strengths: ['High-quality imagery', 'User-friendly navigation', 'Clear call-to-actions', 'Seamless booking process'],
  },
];

export default function CompetitorAnalysis() {
  const [url, setUrl] = useState('');
  const [competitors, setCompetitors] = useState(EXAMPLE_COMPETITORS);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
    // Simulate loading and analysis
    setLoading(true);
    
    // In a real app, this would make an API call to analyze the website
    setTimeout(() => {
      // For demo, just add a fake entry based on the URL
      const newCompetitor = {
        id: competitors.length + 1,
        name: new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '').split('.')[0],
        url: url.startsWith('http') ? url : `https://${url}`,
        category: 'Unknown',
        screenshot: '/placeholder-hero.jpg',
        colors: ['#4A90E2', '#50E3C2', '#FFFFFF', '#333333'],
        fonts: ['Arial', 'sans-serif'],
        technologies: ['Unknown'],
        features: ['To be analyzed'],
        strengths: ['To be determined'],
      };
      
      setCompetitors([newCompetitor, ...competitors]);
      setUrl('');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Competitor Analysis</h2>
      
      {/* URL Input Form */}
      <form onSubmit={handleAnalyze} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="url" className="block text-lg font-semibold text-gray-800 mb-3">
              Enter a competitor&apos;s website URL to analyze
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://example.com"
              className="w-full px-5 py-4 text-lg text-gray-800 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm placeholder:text-gray-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-4 text-white rounded-lg self-end text-lg font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} shadow-sm`}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>
      
      {/* Competitor List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {competitors.map((competitor) => (
          <div
            key={competitor.id}
            className={`border rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer ${selectedCompetitor === competitor.id ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setSelectedCompetitor(competitor.id)}
          >
            <div className="relative h-40 bg-gray-100">
              <Image
                src={competitor.screenshot}
                alt={competitor.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-xl text-gray-800">{competitor.name}</h3>
              <p className="text-base text-gray-600 truncate mt-1">{competitor.url}</p>
              <p className="text-sm text-gray-500 mt-2">{competitor.category}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Competitor Details */}
      {selectedCompetitor && (
        <div className="border rounded-lg p-6">
          {competitors.filter(c => c.id === selectedCompetitor).map(competitor => (
            <div key={competitor.id}>
              <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="md:w-1/3">
                  <div className="relative h-60 w-full bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={competitor.screenshot}
                      alt={competitor.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{competitor.name}</h3>
                  <p className="text-blue-600 mb-4 hover:underline">
                    <a href={competitor.url} target="_blank" rel="noopener noreferrer">{competitor.url}</a>
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-2">Color Palette</h4>
                      <div className="flex space-x-2 mb-4">
                        {competitor.colors.map((color, idx) => (
                          <div key={idx} className="tooltip" data-tip={color}>
                            <div
                              className="w-8 h-8 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      
                      <h4 className="text-base font-semibold text-gray-800 mb-2">Typography</h4>
                      <p className="text-base text-gray-700 mb-4">{competitor.fonts.join(', ')}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {competitor.technologies.map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 text-sm bg-gray-100 rounded-full text-gray-800">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 mb-2">Key Features</h4>
                  <ul className="list-disc pl-5 text-base text-gray-700 space-y-1">
                    {competitor.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-base font-semibold text-gray-800 mb-2">Design Strengths</h4>
                  <ul className="list-disc pl-5 text-base text-gray-700 space-y-1">
                    {competitor.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-base font-semibold text-gray-800 mb-2">Inspiration Notes</h4>
                <textarea
                  className="w-full px-5 py-3 text-base text-gray-800 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm placeholder:text-gray-500"
                  rows={4}
                  placeholder="Add your notes about what inspires you from this design..."
                ></textarea>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-base font-medium shadow-sm">
                  Save Inspiration
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Inspiration Tips */}
      <div className="mt-8 bg-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Tips for Getting Inspiration</h3>
        <ul className="list-disc pl-5 text-indigo-900 space-y-2">
          <li>Look at industry leaders to understand best practices</li>
          <li>Analyze sites that have similar functionality to what you need</li>
          <li>Pay attention to color schemes, typography, and spacing</li>
          <li>Note how they organize information and create user flows</li>
          <li>Don&apos;t copy directly - get inspired and create something unique</li>
        </ul>
      </div>
    </div>
  );
} 