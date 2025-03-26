'use client';

import { useState } from 'react';
import Link from 'next/link';
import { colorAPI } from '@/services/api';

// Type definitions for website analysis response
interface WebsiteAnalysis {
  url: string;
  colors: string[];
  fonts: string[];
  technologies: string[];
}

// Example color palettes
const EXAMPLE_PALETTES = [
  {
    id: 1,
    name: 'Ocean Breeze',
    colors: ['#1A535C', '#4ECDC4', '#F7FFF7', '#FF6B6B', '#FFE66D'],
    source: 'Generated with Adobe Color',
    tags: ['cool', 'calm', 'professional']
  },
  {
    id: 2,
    name: 'Sunset Vibes',
    colors: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429'],
    source: 'Generated with Coolors',
    tags: ['bold', 'warm', 'energetic']
  },
  {
    id: 3,
    name: 'Forest Dream',
    colors: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'],
    source: 'Generated with Paletton',
    tags: ['natural', 'earthy', 'organic']
  },
  {
    id: 4,
    name: 'Tech Modern',
    colors: ['#3A506B', '#5BC0BE', '#0B132B', '#1C2541', '#6FFFE9'],
    source: 'Generated with ColorDesigner',
    tags: ['futuristic', 'tech', 'cool']
  },
];

// Example tools
const COLOR_TOOLS = [
  {
    id: 1,
    name: 'Color Palette Generator',
    description: 'Extract colors from images or create palettes from scratch',
    icon: '🎨'
  },
  {
    id: 2,
    name: 'Color Accessibility Checker',
    description: 'Test color contrast and accessibility compliance',
    icon: '✓'
  },
  {
    id: 3,
    name: 'Color Scheme Analyzer',
    description: 'Analyze the color schemes of uploaded images or websites',
    icon: '🔍'
  },
  {
    id: 4,
    name: 'Trending Colors Explorer',
    description: 'Discover popular color palettes in different industries',
    icon: '📊'
  }
];

// Example predefined palettes
/* const examplePalettes = [
  {
    name: 'Sunset',
    colors: ['#FFC796', '#FF9B82', '#CA3C66', '#692E4D', '#28104E'],
  },
  {
    name: 'Ocean',
    colors: ['#D6F8FF', '#9DE3FA', '#00A8E8', '#007EA7', '#003459'],
  },
  {
    name: 'Forest',
    colors: ['#E8F4D7', '#B6D99C', '#7EBC59', '#508D37', '#305824'],
  },
  {
    name: 'Vintage',
    colors: ['#FCF5E5', '#F8D49A', '#D4A373', '#BB8651', '#9C6644'],
  },
]; */

// Website design resources
/* const designResources = [
  {
    name: 'Color Theory Guide',
    description: 'Learn the basics of color theory and how to apply it to your website designs.',
    link: 'https://www.interaction-design.org/literature/topics/color-theory',
  },
  {
    name: 'Typography Fundamentals',
    description: 'Understanding typography and how to choose the right fonts for your project.',
    link: 'https://www.canva.com/learn/font-design/',
  },
  {
    name: 'UI Design Patterns',
    description: 'Common UI patterns and when to use them in your website design.',
    link: 'https://ui-patterns.com/',
  },
  {
    name: 'Accessibility Checklist',
    description: 'Ensure your website is accessible to all users with this comprehensive guide.',
    link: 'https://www.a11yproject.com/checklist/',
  },
]; */

/**
 * Design tools page component for analyzing website designs and generating color palettes
 */
export default function DesignToolsPage() {
  const [activeTab, setActiveTab] = useState('palette');
  const [colorInput, setColorInput] = useState('#4A90E2');
  const [paletteType, setPaletteType] = useState('analogous');
  const [generatedColors, setGeneratedColors] = useState<string[]>(['#4A90E2', '#4A7BE2', '#634AE2', '#834AE2', '#A34AE2']);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePalette = async () => {
    if (!colorInput.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      setError('Please enter a valid hex color code (e.g., #FF5733)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await colorAPI.generatePalette(colorInput, paletteType);
      setGeneratedColors(data.colors);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle website analysis using the backend API
  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setWebsiteAnalysis(null);

    try {
      const data = await colorAPI.extractFromWebsite(websiteUrl);
      setWebsiteAnalysis(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-800">Design Analysis Tools</h1>
            <p className="text-gray-700 mt-2 text-lg">
              Extract color schemes, analyze design patterns, and create beautiful palettes for your website
            </p>
          </div>
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="flex border-b border-gray-200">
              <button 
                className={`py-4 px-6 text-base font-medium ${activeTab === 'palette' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('palette')}
              >
                Color Palette Generator
              </button>
              <button 
                className={`py-4 px-6 text-base font-medium ${activeTab === 'examples' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('examples')}
              >
                Example Palettes
              </button>
              <button 
                className={`py-4 px-6 text-base font-medium ${activeTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setActiveTab('tools')}
              >
                Design Tools
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Error message display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Color Palette Generator */}
              {activeTab === 'palette' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate a Color Palette</h2>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-grow">
                        <label htmlFor="color" className="block text-lg font-semibold text-gray-800 mb-3">
                          Enter a base color (hex code)
                        </label>
                        <input
                          type="text"
                          id="color"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          className="w-full px-5 py-4 text-lg text-gray-800 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <label htmlFor="paletteType" className="block text-lg font-semibold text-gray-800 mb-3">
                          Palette Type
                        </label>
                        <select
                          id="paletteType"
                          value={paletteType}
                          onChange={(e) => setPaletteType(e.target.value)}
                          className="w-full px-5 py-4 text-lg text-gray-800 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm"
                        >
                          <option value="analogous">Analogous</option>
                          <option value="complementary">Complementary</option>
                          <option value="triadic">Triadic</option>
                          <option value="monochromatic">Monochromatic</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleGeneratePalette}
                        disabled={isLoading}
                        className={`px-8 py-4 rounded-lg self-end text-lg font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition duration-150 shadow-sm`}
                      >
                        {isLoading ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Generated Palette */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Generated Palette</h3>
                    <div className="bg-white p-6 border rounded-lg">
                      <div className="flex flex-wrap gap-4 mb-6">
                        {generatedColors.map((color, idx) => (
                          <div key={idx} className="text-center">
                            <div
                              className="w-24 h-24 rounded-md shadow-md mb-2"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-sm font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                        <div className="p-4 rounded-md" style={{ backgroundColor: generatedColors[3] || '#FFFFFF' }}>
                          <div className="p-4 rounded-md" style={{ backgroundColor: generatedColors[0] || '#4A90E2' }}>
                            <h2 className="text-xl font-bold mb-2" style={{ color: generatedColors[3] || '#FFFFFF' }}>Sample Header</h2>
                            <p style={{ color: generatedColors[3] || '#FFFFFF' }}>This is how your text might look on your primary color background.</p>
                          </div>
                          
                          <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: generatedColors[2] || '#FFFFFF' }}>
                            <h2 className="text-xl font-bold mb-2" style={{ color: generatedColors[4] || '#333333' }}>Secondary Section</h2>
                            <p style={{ color: generatedColors[4] || '#333333' }}>This shows how text looks on your secondary color background.</p>
                            <button className="mt-2 px-4 py-2 rounded-md" style={{ backgroundColor: generatedColors[1] || '#50E3C2', color: generatedColors[3] || '#FFFFFF' }}>
                              Sample Button
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Example Palettes */}
              {activeTab === 'examples' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Curated Color Palettes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {EXAMPLE_PALETTES.map((palette) => (
                      <div key={palette.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="p-4">
                          <h3 className="font-medium text-lg text-gray-800 mb-2">{palette.name}</h3>
                          <p className="text-sm text-gray-500 mb-3">{palette.source}</p>
                          <div className="flex mb-3">
                            {palette.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs mr-2 px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex space-x-1 h-10">
                            {palette.colors.map((color, idx) => (
                              <div 
                                key={idx} 
                                className="flex-1 rounded-sm tooltip" 
                                data-tip={color}
                                style={{ backgroundColor: color }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-indigo-800 mb-2">Tips for Choosing Colors</h3>
                    <ul className="list-disc pl-5 text-indigo-700 space-y-1">
                      <li>Use no more than 3-5 colors in your palette</li>
                      <li>Include at least one neutral color (white, black, gray)</li>
                      <li>Consider color psychology in your industry</li>
                      <li>Test your palette for accessibility (contrast)</li>
                      <li>Use 60-30-10 rule: 60% primary, 30% secondary, 10% accent</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Design Tools */}
              {activeTab === 'tools' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Design Analysis Tools</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {COLOR_TOOLS.map((tool) => (
                      <div key={tool.id} className="flex bg-white p-6 border rounded-lg hover:border-indigo-500 transition-colors duration-200 cursor-pointer">
                        <div className="text-3xl mr-4">{tool.icon}</div>
                        <div>
                          <h3 className="font-medium text-lg text-gray-800 mb-1">{tool.name}</h3>
                          <p className="text-sm text-gray-600">{tool.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">Website Analysis</h3>
                    <div className="border rounded-lg p-6">
                      <p className="text-gray-600 mb-6 text-base">
                        Enter a website URL to extract its color scheme, typography, and design elements.
                      </p>
                      <div className="flex mb-8">
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="flex-grow px-5 py-4 text-lg text-gray-800 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none shadow-sm placeholder:text-gray-500"
                        />
                        <button 
                          onClick={handleAnalyzeWebsite}
                          disabled={isLoading} 
                          className={`px-8 py-4 rounded-r-lg text-lg font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition duration-150 shadow-sm`}
                        >
                          {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                      
                      {websiteAnalysis ? (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Colors</h4>
                            <div className="flex flex-wrap gap-2">
                              {websiteAnalysis.colors.map((color, idx) => (
                                <div key={idx} className="text-center">
                                  <div
                                    className="w-12 h-12 rounded-md shadow-sm"
                                    style={{ backgroundColor: color }}
                                  ></div>
                                  <span className="text-xs font-mono">{color}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Fonts</h4>
                            <div className="flex flex-wrap gap-2">
                              {websiteAnalysis.fonts.map((font, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-gray-800 text-sm">
                                  {font}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                              {websiteAnalysis.technologies.map((tech, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-gray-800 text-sm">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 p-8 rounded-lg flex flex-col items-center justify-center text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500">
                            Enter a URL above to analyze a website&apos;s design elements.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Integration with other SiteStack features */}
          <div className="bg-indigo-600 text-white rounded-lg shadow-lg p-8 mt-10">
            <h2 className="text-2xl font-bold mb-4">Ready to Apply These Designs?</h2>
            <p className="mb-6">
              Use our design tools to analyze websites, create color palettes, and then apply them to your own website.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/competitors"
                className="bg-white text-indigo-600 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 transition duration-300 text-center"
              >
                Analyze Competitors
              </Link>
              <Link 
                href="/generator"
                className="bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-400 transition duration-300 text-center"
              >
                Generate Website
              </Link>
            </div>
          </div>
          
          {/* Additional Resources */}
          <div className="mt-10 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Design Resources</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">Color theory fundamentals for web design</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">Typography pairings that work well together</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">Web accessibility guidelines for colors</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">Design trends and patterns in 2024</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 