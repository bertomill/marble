'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { WebsiteExample, Screenshot, ComponentAnnotation, COMPONENT_TYPES } from '@/types/WebsiteExamples';
import { addWebsiteExample } from '@/utils/firebase/websiteExamples';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Simple function to extract domain from URL
const extractDomain = (url: string) => {
  try {
    return url.split('//')[1].split('/')[0];
  } catch {
    return url;
  }
};

// Real AI analysis using OpenAI's Vision model
const analyzeScreenshot = async (imageBase64: string): Promise<{
  components: ComponentAnnotation[];
  suggestedTags: string[];
  colors: string[];
}> => {
  try {
    console.log('Starting screenshot analysis...');
    
    const response = await fetch('/api/analyze-screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Screenshot analysis failed:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorData
      });
      throw new Error(errorData.details || 'Failed to analyze screenshot');
    }

    const analysis = await response.json();
    
    // Validate the response structure
    if (!analysis || typeof analysis !== 'object') {
      console.error('Invalid analysis response:', analysis);
      throw new Error('Invalid analysis response format');
    }

    // Ensure required properties exist with correct types
    if (!Array.isArray(analysis.components) || 
        !Array.isArray(analysis.suggestedTags) || 
        !Array.isArray(analysis.colors)) {
      console.error('Missing required properties in analysis:', analysis);
      throw new Error('Invalid analysis response structure');
    }

    console.log('Screenshot analysis completed successfully:', analysis);
    return analysis;
  } catch (error) {
    console.error('Error in analyzeScreenshot:', error);
    throw error;
  }
};

export default function ScrapePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Screenshot states
  const [screenshots, setScreenshots] = useState<{
    file: File;
    preview: string;
    description: string;
    components: ComponentAnnotation[];
  }[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<{
    file: File | null;
    preview: string;
    description: string;
    components?: ComponentAnnotation[];
  }>({
    file: null,
    preview: '',
    description: '',
  });
  
  // Form states for editing data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>(['Design']);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  
  // Component editing
  const [editingComponent, setEditingComponent] = useState<{
    screenshotIndex: number;
    component: ComponentAnnotation;
  } | null>(null);
  
  // Handle URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value && !title) {
      // Auto-fill title based on domain
      setTitle(extractDomain(e.target.value));
      setDescription(`Website description for ${extractDomain(e.target.value)}`);
    }
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.add('border-purple-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('border-purple-500');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('border-purple-500');

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  // Handle paste
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFile(file);
        }
        break;
      }
    }
  };

  // Common file handling logic
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCurrentScreenshot({
          file,
          preview: e.target.result as string,
          description: `Screenshot of ${url || 'website'}`,
        });
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Update handleFileChange to use common handling logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Add useEffect for paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [url]); // Include url in dependencies since we use it in handleFile
  
  // Save analyzed screenshot to Firebase
  const saveScreenshotToFirebase = async (file: File, screenshotId: string): Promise<string> => {
    try {
      // Convert File to Blob for upload
      const blob = await new Response(file).blob();
      
      // Create storage reference with unique path
      const storageRef = ref(storage, `screenshots/${screenshotId}`);
      
      // Upload the file and get URL
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      throw new Error('Failed to upload screenshot to storage');
    }
  };

  // Save just the current screenshot to Firebase
  const handleSaveCurrentScreenshot = async () => {
    if (!currentScreenshot.file || !currentScreenshot.preview || !currentScreenshot.components) {
      setError('Please upload and analyze a screenshot first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const screenshotId = `screenshot_${Date.now()}`;
      const imageUrl = await saveScreenshotToFirebase(currentScreenshot.file, screenshotId);

      // Create website example with just this screenshot
      const screenshotForFirebase: Screenshot = {
        id: screenshotId,
        imageUrl: imageUrl,
        altText: currentScreenshot.description,
        description: currentScreenshot.description,
        components: currentScreenshot.components,
      };

      // Use domain from URL or a default name if URL is empty
      const autoTitle = url ? extractDomain(url) : 'Unnamed Website';
      
      // Create website example object
      const websiteExample: Omit<WebsiteExample, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title || autoTitle,
        description: description || `Screenshot of ${autoTitle}`,
        url: url || '',
        category: selectedCategory.length > 0 ? selectedCategory : ['Design'],
        type: 'Screen',
        tags: selectedTags.length > 0 ? selectedTags : suggestedTags.slice(0, 5),
        screenshots: [screenshotForFirebase],
      };
      
      // Add to database
      await addWebsiteExample(websiteExample);
      
      setSuccess('Screenshot saved to database successfully!');
      
      // Clear current screenshot after saving
      setCurrentScreenshot({
        file: null,
        preview: '',
        description: '',
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while saving the screenshot.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze screenshot with AI
  const handleAnalyzeScreenshot = async () => {
    if (!currentScreenshot.file || !currentScreenshot.preview) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Get base64 image data from preview (remove data:image/xxx;base64, prefix)
      const base64Image = currentScreenshot.preview.split(',')[1];
      
      // Call AI analysis function
      const analysis = await analyzeScreenshot(base64Image);
      
      // Update screenshot with detected components
      setCurrentScreenshot(prev => ({
        ...prev,
        components: analysis.components,
      }));
      
      // Add detected tags to suggested tags
      setSuggestedTags(prevTags => {
        const newTags = [...prevTags];
        analysis.suggestedTags.forEach(tag => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });
        return newTags;
      });
      
      // Add detected colors
      setDetectedColors(analysis.colors);
      
      setSuccess('Screenshot analyzed successfully!');
    } catch (error) {
      setError('Error analyzing screenshot. Please try again.');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Add screenshot to the collection
  const handleAddScreenshot = () => {
    if (!currentScreenshot.file || !currentScreenshot.description.trim()) {
      setError('Please select a screenshot and add a description.');
      return;
    }
    
    setScreenshots([...screenshots, {
      file: currentScreenshot.file,
      preview: currentScreenshot.preview,
      description: currentScreenshot.description,
      components: currentScreenshot.components || [],
    }]);
    
    // Reset current screenshot
    setCurrentScreenshot({
      file: null,
      preview: '',
      description: '',
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setSuccess('Screenshot added to collection!');
    setTimeout(() => setSuccess(''), 2000);
  };
  
  // Remove a screenshot
  const handleRemoveScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };
  
  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Add suggested tag
  const handleAddSuggestedTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setSuggestedTags(suggestedTags.filter(t => t !== tag));
    }
  };
  
  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };
  
  // Toggle category selection
  const handleCategoryToggle = (category: string) => {
    if (selectedCategory.includes(category)) {
      setSelectedCategory(selectedCategory.filter(c => c !== category));
    } else {
      setSelectedCategory([...selectedCategory, category]);
    }
  };
  
  // Edit component
  const handleEditComponent = (screenshotIndex: number, component: ComponentAnnotation) => {
    setEditingComponent({ screenshotIndex, component });
  };
  
  // Update component
  const handleUpdateComponent = (updatedComponent: ComponentAnnotation) => {
    if (!editingComponent) return;
    
    const updatedScreenshots = [...screenshots];
    const screenshotIndex = editingComponent.screenshotIndex;
    
    updatedScreenshots[screenshotIndex] = {
      ...updatedScreenshots[screenshotIndex],
      components: updatedScreenshots[screenshotIndex].components.map(comp => 
        comp.id === updatedComponent.id ? updatedComponent : comp
      ),
    };
    
    setScreenshots(updatedScreenshots);
    setEditingComponent(null);
  };
  
  // Save to database
  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!title.trim() || !description.trim() || !url.trim() || selectedCategory.length === 0 || screenshots.length === 0) {
        throw new Error('Please fill in all required fields and add at least one screenshot.');
      }
      
      // Create Firebase screenshots
      const screenshotsPromises = screenshots.map(async (screenshot, index) => {
        const screenshotId = `screenshot_${Date.now()}_${index}`;
        
        // Upload the screenshot file to Firebase Storage
        const imageUrl = await saveScreenshotToFirebase(screenshot.file, screenshotId);
        
        // Return the Screenshot object with the Firebase Storage URL
        return {
          id: screenshotId,
          imageUrl: imageUrl, // Use the real Firebase Storage URL instead of the data URL
          altText: screenshot.description,
          description: screenshot.description,
          components: screenshot.components,
        };
      });
      
      // Wait for all screenshot uploads to complete
      const screenshotsForFirebase: Screenshot[] = await Promise.all(screenshotsPromises);
      
      // Create website example object
      const websiteExample: Omit<WebsiteExample, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        category: selectedCategory,
        type: 'App',
        tags: selectedTags,
        screenshots: screenshotsForFirebase,
      };
      
      // Add to database
      await addWebsiteExample(websiteExample);
      
      setSuccess('Website example added to database successfully!');
      
      // Redirect to discover page after short delay
      setTimeout(() => {
        router.push('/dashboard/discover');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while saving the data.');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to use the scraper tool</h1>
          <Link 
            href="/login" 
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href="/dashboard/discover" 
          className="text-purple-400 hover:text-purple-300 mb-4 inline-flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Discover
        </Link>
        <h1 className="text-4xl font-bold text-white mt-2">Website Scraper Tool</h1>
        <p className="text-gray-400 mt-2">
          Enter a URL and upload screenshots to analyze and save website examples.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500 text-white p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      {/* Website Information */}
      <div className="bg-[#1a1625] p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Website Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com"
              className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Categories <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {['Business', 'Design', 'Productivity', 'E-commerce', 'Portfolio', 'Entertainment', 'Social Media'].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedCategory.includes(category)
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
                } transition-colors`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Screenshot Upload */}
      <div className="bg-[#1a1625] p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Add Screenshots</h2>
        
        {/* Screenshot upload form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Upload Screenshot
            </label>
            <div 
              className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#352f57] rounded-md transition-colors duration-200 cursor-pointer"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {currentScreenshot.preview ? (
                <div className="space-y-2 text-center">
                  <img
                    src={currentScreenshot.preview}
                    alt="Screenshot preview"
                    className="mx-auto h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentScreenshot({ file: null, preview: '', description: '' })}
                    className="text-red-400 hover:text-red-300 text-sm inline-flex items-center"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center text-sm text-gray-500">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-[#1a1625] rounded-md font-medium text-purple-500 hover:text-purple-400 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="mt-1">or drag and drop</p>
                    <p className="mt-1">or paste from clipboard</p>
                  </div>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="screenshotDescription" className="block text-sm font-medium text-gray-300 mb-1">
              Screenshot Description
            </label>
            <textarea
              id="screenshotDescription"
              value={currentScreenshot.description}
              onChange={(e) => setCurrentScreenshot({ ...currentScreenshot, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              placeholder="Describe what this screenshot shows..."
            />
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleAnalyzeScreenshot}
                disabled={!currentScreenshot.file || isAnalyzing}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                  !currentScreenshot.file || isAnalyzing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
              </button>
              
              <button
                type="button"
                onClick={handleSaveCurrentScreenshot}
                disabled={!currentScreenshot.components || isLoading}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                  !currentScreenshot.components || isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                {isLoading ? 'Saving...' : 'Quick Save'}
              </button>
              
              <button
                type="button"
                onClick={handleAddScreenshot}
                disabled={!currentScreenshot.file || !currentScreenshot.description}
                className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                  !currentScreenshot.file || !currentScreenshot.description ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                Add to Collection
              </button>
            </div>
          </div>
        </div>
        
        {/* AI-detected colors */}
        {detectedColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-2">Detected Colors</h3>
            <div className="flex flex-wrap gap-2">
              {detectedColors.map((color, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 bg-[#2a2545] px-3 py-2 rounded-md"
                >
                  <div 
                    className="w-6 h-6 rounded-full border border-white" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm text-white">{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Added screenshots */}
        {screenshots.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-white mb-2">Added Screenshots ({screenshots.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="bg-[#2a2545] rounded-lg overflow-hidden">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={screenshot.preview}
                      alt={screenshot.description}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-white mb-1 font-medium">
                      {screenshot.description}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      {screenshot.components?.length || 0} components
                    </p>
                    
                    {/* Show component list if there are any */}
                    {screenshot.components && screenshot.components.length > 0 && (
                      <div className="mb-2">
                        <details className="text-sm">
                          <summary className="text-purple-400 cursor-pointer">View Components</summary>
                          <div className="mt-2 space-y-1 pl-2 border-l border-[#352f57]">
                            {screenshot.components.map((component) => (
                              <div key={component.id} className="flex justify-between">
                                <span className="text-gray-300">{component.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleEditComponent(index, component)}
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                >
                                  Edit
                                </button>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(index)}
                      className="text-red-400 hover:text-red-300 text-sm inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tags Section */}
      <div className="bg-[#1a1625] p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
        
        {/* AI-suggested tags */}
        {suggestedTags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-medium text-white mb-2">AI-Suggested Tags</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddSuggestedTag(tag)}
                  className="bg-[#2a2545] text-gray-300 hover:bg-[#352f57] hover:text-white px-3 py-1 rounded-full text-sm transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Selected tags */}
        <div className="mb-4">
          <h3 className="text-md font-medium text-white mb-2">Selected Tags</h3>
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="bg-[#2a2545] text-white px-3 py-1 rounded-full flex items-center text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No tags selected yet.</p>
          )}
        </div>
        
        {/* Add custom tag */}
        <div className="flex">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add a custom tag..."
            className="flex-1 px-4 py-2 rounded-l-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || screenshots.length === 0}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            isLoading || screenshots.length === 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors`}
        >
          {isLoading ? 'Saving...' : 'Save to Database'}
        </button>
      </div>
      
      {/* Component Edit Modal */}
      {editingComponent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-[#1a1625] p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Component</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="componentName" className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="componentName"
                  value={editingComponent.component.name}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    component: {...editingComponent.component, name: e.target.value}
                  })}
                  className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label htmlFor="componentDescription" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="componentDescription"
                  value={editingComponent.component.description}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    component: {...editingComponent.component, description: e.target.value}
                  })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label htmlFor="componentType" className="block text-sm font-medium text-gray-300 mb-1">
                  Component Type
                </label>
                <select
                  id="componentType"
                  value={editingComponent.component.componentType}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    component: {...editingComponent.component, componentType: e.target.value}
                  })}
                  className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {COMPONENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {editingComponent.component.tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-[#2a2545] text-white px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComponent({
                            ...editingComponent,
                            component: {
                              ...editingComponent.component,
                              tags: editingComponent.component.tags.filter(t => t !== tag)
                            }
                          });
                        }}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !editingComponent.component.tags.includes(tagInput.trim())) {
                          setEditingComponent({
                            ...editingComponent,
                            component: {
                              ...editingComponent.component,
                              tags: [...editingComponent.component.tags, tagInput.trim()]
                            }
                          });
                          setTagInput('');
                        }
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 rounded-l-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim() && !editingComponent.component.tags.includes(tagInput.trim())) {
                        setEditingComponent({
                          ...editingComponent,
                          component: {
                            ...editingComponent.component,
                            tags: [...editingComponent.component.tags, tagInput.trim()]
                          }
                        });
                        setTagInput('');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setEditingComponent(null)}
                className="px-4 py-2 bg-[#2a2545] text-white rounded-md hover:bg-[#352f57] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateComponent(editingComponent.component)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 