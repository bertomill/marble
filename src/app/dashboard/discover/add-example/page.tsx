'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { WebsiteExample, Screenshot, ComponentAnnotation, WEBSITE_CATEGORIES, COMPONENT_TYPES } from '@/types/WebsiteExamples';
import { addWebsiteExample } from '@/utils/firebase/websiteExamples';

export default function AddExamplePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [websiteType, setWebsiteType] = useState<WebsiteExample['type']>('App');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Screenshots states
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [currentScreenshot, setCurrentScreenshot] = useState<{
    file: File | null;
    preview: string;
    description: string;
    components: ComponentAnnotation[];
  }>({
    file: null,
    preview: '',
    description: '',
    components: [],
  });
  
  // Component annotation states
  const [currentComponent, setCurrentComponent] = useState<{
    name: string;
    description: string;
    componentType: string;
    tags: string[];
    tagInput: string;
  }>({
    name: '',
    description: '',
    componentType: '',
    tags: [],
    tagInput: '',
  });
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to add website examples</h1>
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setCurrentScreenshot(prev => ({
            ...prev,
            file,
            preview: e.target!.result as string,
          }));
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Add a tag to the website example
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove a tag from the website example
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Add component tag
  const handleAddComponentTag = () => {
    if (currentComponent.tagInput.trim() && !currentComponent.tags.includes(currentComponent.tagInput.trim())) {
      setCurrentComponent({
        ...currentComponent,
        tags: [...currentComponent.tags, currentComponent.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  // Remove component tag
  const handleRemoveComponentTag = (tagToRemove: string) => {
    setCurrentComponent({
      ...currentComponent,
      tags: currentComponent.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Add a component to the current screenshot
  const handleAddComponent = () => {
    if (currentComponent.name.trim() && currentComponent.description.trim() && currentComponent.componentType) {
      const newComponent: ComponentAnnotation = {
        id: `component_${Date.now()}`,
        name: currentComponent.name,
        description: currentComponent.description,
        componentType: currentComponent.componentType,
        tags: currentComponent.tags,
      };
      
      setCurrentScreenshot(prev => ({
        ...prev,
        components: [...prev.components, newComponent],
      }));
      
      // Reset component form
      setCurrentComponent({
        name: '',
        description: '',
        componentType: '',
        tags: [],
        tagInput: '',
      });
    }
  };

  // Remove a component from the current screenshot
  const handleRemoveComponent = (componentId: string) => {
    setCurrentScreenshot(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
    }));
  };

  // Add screenshot to the screenshots array
  const handleAddScreenshot = () => {
    if (currentScreenshot.file && currentScreenshot.description.trim() && currentScreenshot.components.length > 0) {
      const newScreenshot: Screenshot = {
        id: `screenshot_${Date.now()}`,
        imageUrl: currentScreenshot.preview,
        altText: currentScreenshot.description,
        description: currentScreenshot.description,
        components: currentScreenshot.components,
      };
      
      setScreenshots([...screenshots, newScreenshot]);
      
      // Reset screenshot form
      setCurrentScreenshot({
        file: null,
        preview: '',
        description: '',
        components: [],
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError('Please add an image, description, and at least one component to the screenshot.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Remove screenshot from the screenshots array
  const handleRemoveScreenshot = (screenshotId: string) => {
    setScreenshots(screenshots.filter(screenshot => screenshot.id !== screenshotId));
  };

  // Submit the entire form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (
        !title.trim() || 
        !description.trim() || 
        !url.trim() || 
        selectedCategories.length === 0 || 
        screenshots.length === 0
      ) {
        throw new Error('Please fill in all required fields and add at least one screenshot.');
      }
      
      // Create website example object
      const websiteExample: Omit<WebsiteExample, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        category: selectedCategories,
        type: websiteType,
        tags,
        screenshots,
      };
      
      // Add to database
      await addWebsiteExample(websiteExample);
      
      // Success message
      setSuccess('Website example added successfully!');
      
      // Redirect to the discover page after a short delay
      setTimeout(() => {
        router.push('/dashboard/discover');
      }, 2000);
      
    } catch (error) {
      let message = 'An error occurred while adding the website example.';
      if (error instanceof Error) {
        message = error.message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-4xl font-bold text-white mt-2">Add Website Example</h1>
        <p className="text-gray-400 mt-2">Add a new website example with screenshots and component annotations.</p>
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
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Website Information */}
        <div className="bg-[#1a1625] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Website Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
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
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['App', 'Screen', 'Marketing Page', 'UI Element', 'Flow'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWebsiteType(type as WebsiteExample['type'])}
                  className={`px-4 py-2 rounded-full text-sm ${
                    websiteType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
                  } transition-colors`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Categories <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WEBSITE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedCategories.includes(category)
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#2a2545] text-gray-300 hover:bg-[#352f57]'
                  } transition-colors`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag) => (
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
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
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
        </div>
        
        {/* Screenshots Section */}
        <div className="bg-[#1a1625] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Screenshots</h2>
          
          {/* Current screenshots */}
          {screenshots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-2">Added Screenshots ({screenshots.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.map((screenshot) => (
                  <div key={screenshot.id} className="bg-[#2a2545] rounded-lg overflow-hidden">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={screenshot.imageUrl}
                        alt={screenshot.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-white mb-1 font-medium">
                        {screenshot.description}
                      </p>
                      <p className="text-gray-400 text-sm mb-2">
                        {screenshot.components.length} components
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(screenshot.id)}
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
          
          {/* Add new screenshot */}
          <div className="border-t border-[#352f57] pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Add New Screenshot</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {/* Screenshot image upload */}
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Screenshot Image <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#352f57] rounded-md">
                  {currentScreenshot.preview ? (
                    <div className="space-y-2 text-center">
                      <img
                        src={currentScreenshot.preview}
                        alt="Screenshot preview"
                        className="mx-auto h-64 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setCurrentScreenshot({ ...currentScreenshot, file: null, preview: '' })}
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
                      <div className="flex text-sm text-gray-500 justify-center">
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
                        <p className="pl-1 text-gray-400">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {/* Screenshot description */}
                <div className="mt-4">
                  <label htmlFor="screenshotDescription" className="block text-sm font-medium text-gray-300 mb-1">
                    Screenshot Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="screenshotDescription"
                    value={currentScreenshot.description}
                    onChange={(e) => setCurrentScreenshot({ ...currentScreenshot, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-md bg-[#2a2545] text-white border border-[#352f57] focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe what this screenshot shows..."
                  />
                </div>
              </div>
              
              <div>
                {/* Component annotations */}
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Components in This Screenshot</h4>
                  
                  {/* Added components */}
                  {currentScreenshot.components.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {currentScreenshot.components.map((component) => (
                        <div key={component.id} className="bg-[#2a2545] p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-white font-medium">{component.name}</h5>
                              <p className="text-gray-400 text-sm">{component.description}</p>
                              <p className="text-gray-500 text-xs mt-1">Type: {component.componentType}</p>
                              {component.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {component.tags.map((tag) => (
                                    <span key={tag} className="bg-[#1a1625] text-gray-300 px-2 py-0.5 rounded-full text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(component.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add new component */}
                  <div className="bg-[#2a2545] p-4 rounded-md">
                    <h5 className="text-sm font-medium text-white mb-2">Add New Component</h5>
                    
                    {/* Component name */}
                    <div className="mb-3">
                      <label htmlFor="componentName" className="block text-xs font-medium text-gray-300 mb-1">
                        Component Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="componentName"
                        value={currentComponent.name}
                        onChange={(e) => setCurrentComponent({ ...currentComponent, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-md bg-[#1a1625] text-white border border-[#352f57] focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                        placeholder="e.g., Navigation Bar"
                      />
                    </div>
                    
                    {/* Component description */}
                    <div className="mb-3">
                      <label htmlFor="componentDescription" className="block text-xs font-medium text-gray-300 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="componentDescription"
                        value={currentComponent.description}
                        onChange={(e) => setCurrentComponent({ ...currentComponent, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 rounded-md bg-[#1a1625] text-white border border-[#352f57] focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                        placeholder="Describe this component..."
                      />
                    </div>
                    
                    {/* Component type */}
                    <div className="mb-3">
                      <label htmlFor="componentType" className="block text-xs font-medium text-gray-300 mb-1">
                        Component Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="componentType"
                        value={currentComponent.componentType}
                        onChange={(e) => setCurrentComponent({ ...currentComponent, componentType: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-md bg-[#1a1625] text-white border border-[#352f57] focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                      >
                        <option value="">Select a type...</option>
                        {COMPONENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Component tags */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Component Tags
                      </label>
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {currentComponent.tags.map((tag) => (
                          <div
                            key={tag}
                            className="bg-[#1a1625] text-white px-2 py-0.5 rounded-full flex items-center text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveComponentTag(tag)}
                              className="ml-1 text-gray-400 hover:text-white"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={currentComponent.tagInput}
                          onChange={(e) => setCurrentComponent({ ...currentComponent, tagInput: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComponentTag())}
                          placeholder="Add a tag..."
                          className="flex-1 px-3 py-1.5 rounded-l-md bg-[#1a1625] text-white border border-[#352f57] focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddComponentTag}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 transition-colors text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {/* Add component button */}
                    <button
                      type="button"
                      onClick={handleAddComponent}
                      className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      Add Component
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add screenshot button */}
            <button
              type="button"
              onClick={handleAddScreenshot}
              disabled={!currentScreenshot.file || !currentScreenshot.description || currentScreenshot.components.length === 0}
              className={`mt-6 px-5 py-2.5 rounded-md text-white font-medium ${
                !currentScreenshot.file || !currentScreenshot.description || currentScreenshot.components.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } transition-colors`}
            >
              Add Screenshot to Collection
            </button>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || screenshots.length === 0}
            className={`px-6 py-3 rounded-md text-white font-medium ${
              isSubmitting || screenshots.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors`}
          >
            {isSubmitting ? 'Saving...' : 'Save Website Example'}
          </button>
        </div>
      </form>
    </div>
  );
} 