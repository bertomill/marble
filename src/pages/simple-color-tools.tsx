import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

const SimpleColorTools: NextPage = () => {
  // Cloud Run URL
  const CLOUD_RUN_URL = 'https://sitestack-simple-api-ibfi5uohhq-uc.a.run.app';
  const LOCAL_URL = 'http://localhost:8080';
  
  // State for API base URL
  const [apiBaseUrl, setApiBaseUrl] = useState(LOCAL_URL);
  const [useCloudRun, setUseCloudRun] = useState(false);
  
  // State for image URL extraction
  const [imageUrl, setImageUrl] = useState('');
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [extractError, setExtractError] = useState('');
  
  // State for palette generation
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [generatedColors, setGeneratedColors] = useState<string[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Determine the API base URL based on environment
  useEffect(() => {
    if (useCloudRun) {
      setApiBaseUrl(CLOUD_RUN_URL);
    } else if (process.env.NEXT_PUBLIC_API_URL) {
      setApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    } else if (window.location.hostname !== 'localhost') {
      // If not running locally and no env var, use Cloud Run URL
      setApiBaseUrl(CLOUD_RUN_URL);
    } else {
      // Default to localhost for local development
      setApiBaseUrl(LOCAL_URL);
    }
  }, [useCloudRun]);

  // Toggle between local and Cloud Run API
  const toggleApiEndpoint = () => {
    setUseCloudRun(!useCloudRun);
  };

  // Function to extract colors from image URL
  const handleExtractColors = async () => {
    if (!imageUrl) {
      setExtractError('Please enter an image URL');
      return;
    }
    
    setLoadingExtract(true);
    setExtractError('');
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/extract-colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, colorCount: 5 }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract colors');
      }
      
      setExtractedColors(data.colors);
    } catch (error) {
      console.error('Error extracting colors:', error);
      setExtractError(`Error: ${error instanceof Error ? error.message : 'Failed to extract colors'}`);
    } finally {
      setLoadingExtract(false);
    }
  };

  // Function to generate color palette
  const handleGeneratePalette = async () => {
    if (!baseColor.match(/^#([0-9A-F]{3}){1,2}$/i)) {
      setGenerateError('Please enter a valid hex color (e.g., #FF5733)');
      return;
    }
    
    setLoadingGenerate(true);
    setGenerateError('');
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/generate-palette`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ baseColor }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate palette');
      }
      
      setGeneratedColors(data.colors);
    } catch (error) {
      console.error('Error generating palette:', error);
      setGenerateError(`Error: ${error instanceof Error ? error.message : 'Failed to generate palette'}`);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Color swatch component
  const ColorSwatch = ({ color }: { color: string }) => (
    <div className="flex flex-col items-center mr-4 mb-4">
      <div
        className="w-20 h-20 rounded shadow-md"
        style={{ backgroundColor: color }}
      />
      <span className="mt-2 text-sm font-mono">{color}</span>
    </div>
  );

  return (
    <>
      <Head>
        <title>Simple Color Tools</title>
        <meta name="description" content="Simple color extraction and palette generation tools" />
      </Head>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Simple Color Tools</h1>
        
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="text-sm text-gray-700 font-medium">
            API URL: <span className="text-blue-600">{apiBaseUrl}</span>
          </div>
          <button
            onClick={toggleApiEndpoint}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded transition-colors"
          >
            Switch to {useCloudRun ? 'Local API' : 'Cloud Run API'}
          </button>
        </div>
        
        {/* Extract Colors Section */}
        <section className="mb-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Extract Colors from Image</h2>
          
          <div className="mb-4">
            <label htmlFor="imageUrl" className="block mb-2 text-sm font-medium">
              Image URL:
            </label>
            <div className="flex">
              <input
                type="text"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-grow px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleExtractColors}
                disabled={loadingExtract}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loadingExtract ? 'Loading...' : 'Extract'}
              </button>
            </div>
            {extractError && <p className="mt-2 text-red-500 text-sm">{extractError}</p>}
          </div>
          
          {imageUrl && extractedColors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Extracted Colors:</h3>
              <div className="flex flex-wrap">
                {extractedColors.map((color, index) => (
                  <ColorSwatch key={`extract-${index}`} color={color} />
                ))}
              </div>
              
              {/* Preview image */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Source Image:</h3>
                <img
                  src={imageUrl}
                  alt="Source for color extraction"
                  className="max-h-60 rounded shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
                  }}
                />
              </div>
            </div>
          )}
        </section>
        
        {/* Generate Palette Section */}
        <section className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Generate Color Palette</h2>
          
          <div className="mb-4">
            <label htmlFor="baseColor" className="block mb-2 text-sm font-medium">
              Base Color:
            </label>
            <div className="flex">
              <input
                type="color"
                id="baseColorPicker"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="h-10 w-10 rounded-l border border-r-0"
              />
              <input
                type="text"
                id="baseColor"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-grow px-4 py-2 border rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleGeneratePalette}
                disabled={loadingGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loadingGenerate ? 'Loading...' : 'Generate'}
              </button>
            </div>
            {generateError && <p className="mt-2 text-red-500 text-sm">{generateError}</p>}
          </div>
          
          {generatedColors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Generated Palette:</h3>
              <div className="flex flex-wrap">
                {generatedColors.map((color, index) => (
                  <ColorSwatch key={`palette-${index}`} color={color} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default SimpleColorTools; 