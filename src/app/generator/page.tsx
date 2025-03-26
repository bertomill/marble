'use client';

import { useState } from 'react';
import Image from 'next/image';

const COLOR_SCHEMES = [
  {
    name: 'Modern Purple',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    background: '#F9FAFB',
    text: '#1F2937',
  },
  {
    name: 'Ocean Blue',
    primary: '#2563EB',
    secondary: '#3B82F6',
    accent: '#10B981',
    background: '#F3F4F6',
    text: '#1E293B',
  },
  {
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#F97316',
    accent: '#6366F1',
    background: '#FFFBEB',
    text: '#334155',
  },
];

const TYPOGRAPHY_OPTIONS = [
  {
    name: 'Modern Sans',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    sample: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    name: 'Classic Serif',
    headingFont: 'Merriweather',
    bodyFont: 'Source Sans Pro',
    sample: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    name: 'Creative Mix',
    headingFont: 'Poppins',
    bodyFont: 'Roboto',
    sample: 'The quick brown fox jumps over the lazy dog.',
  },
];

const LAYOUT_OPTIONS = [
  {
    name: 'Hero-Centered',
    description: 'Large hero section with supporting features grid',
  },
  {
    name: 'Split Content',
    description: 'Side-by-side content and image sections',
  },
  {
    name: 'Minimal Cards',
    description: 'Clean card-based layout with minimal design',
  },
];

export default function GeneratorPage() {
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);
  const [selectedTypography, setSelectedTypography] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState(0);
  const [preview, setPreview] = useState('desktop'); // 'desktop' or 'mobile'

  return (
    <div className="p-6 sm:p-8 bg-[#1e1a2e] text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Your Website Design</h1>
          <p className="text-gray-300 mt-2">
            Based on our analysis, we&apos;ve created the perfect website for your business
          </p>
        </div>
        
        {/* Preview Area */}
        <div className="bg-[#2a2545] rounded-lg shadow-lg overflow-hidden mb-10">
          <div className="flex border-b border-[#352f57]">
            <button
              onClick={() => setPreview('desktop')}
              className={`py-2 px-4 font-medium ${
                preview === 'desktop' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-300'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreview('mobile')}
              className={`py-2 px-4 font-medium ${
                preview === 'mobile' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-300'
              }`}
            >
              Mobile
            </button>
          </div>
          
          <div className="p-6 flex justify-center bg-[#1e1a2e]">
            {/* This would typically be an iframe or a component that renders the website preview */}
            <div className={`bg-white shadow-xl overflow-hidden ${preview === 'desktop' ? 'w-full max-w-4xl' : 'w-80'}`}>
              <div className="h-96 flex items-center justify-center border border-gray-200">
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold" style={{ color: COLOR_SCHEMES[selectedColorScheme].primary }}>
                    Your Website Preview
                  </h2>
                  <p className="my-4" style={{ color: COLOR_SCHEMES[selectedColorScheme].text }}>
                    In a real implementation, this would show a live preview of your website with the selected styles applied.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: COLOR_SCHEMES[selectedColorScheme].primary }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Color Scheme Selection */}
          <div className="bg-[#2a2545] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Color Scheme</h2>
            <div className="space-y-4">
              {COLOR_SCHEMES.map((scheme, index) => (
                <div 
                  key={scheme.name}
                  onClick={() => setSelectedColorScheme(index)}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedColorScheme === index ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-[#352f57] hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex space-x-2 mr-4">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.primary }}></div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.secondary }}></div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.accent }}></div>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: scheme.background }}></div>
                    </div>
                    {selectedColorScheme === index && (
                      <div className="absolute right-4 text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Typography Selection */}
          <div className="bg-[#2a2545] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Typography</h2>
            <div className="space-y-4">
              {TYPOGRAPHY_OPTIONS.map((typography, index) => (
                <div 
                  key={typography.name}
                  onClick={() => setSelectedTypography(index)}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTypography === index ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-[#352f57] hover:border-indigo-400'
                  }`}
                >
                  <div>
                    <div className="mb-2 text-gray-300">
                      <span className="font-medium">Heading: </span>
                      {typography.headingFont}
                    </div>
                    <div className="mb-2 text-gray-300">
                      <span className="font-medium">Body: </span>
                      {typography.bodyFont}
                    </div>
                    <div className="text-sm text-gray-400">{typography.sample}</div>
                  </div>
                  {selectedTypography === index && (
                    <div className="absolute right-4 top-4 text-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Layout Selection */}
          <div className="bg-[#2a2545] rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Layout</h2>
            <div className="space-y-4">
              {LAYOUT_OPTIONS.map((layout, index) => (
                <div 
                  key={layout.name}
                  onClick={() => setSelectedLayout(index)}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedLayout === index ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-[#352f57] hover:border-indigo-400'
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-300">{layout.name}</div>
                    <div className="text-sm text-gray-400 mt-1">{layout.description}</div>
                  </div>
                  {selectedLayout === index && (
                    <div className="absolute right-4 top-4 text-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-10 flex justify-end space-x-4">
          <button className="px-6 py-2 border border-[#352f57] rounded-lg text-gray-300 hover:bg-[#352f57] transition-colors">
            Reset
          </button>
          <button className="px-6 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors">
            Generate Website
          </button>
        </div>
      </div>
    </div>
  );
}