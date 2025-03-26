'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addComponentToFeed, ComponentItem } from '@/lib/componentFeed';
import { useAuth } from '@/contexts/AuthContext';

export default function AddComponent() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
    type: 'UI Element',
    category: ''
  });
  const [error, setError] = useState('');

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.url || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    // Use a placeholder image if none provided
    const imageUrl = formData.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(formData.title)}`;

    setIsSubmitting(true);
    setError('');

    try {
      // Prepare the component data
      const componentData: Omit<ComponentItem, 'id' | 'createdAt'> = {
        title: formData.title,
        description: formData.description,
        image: imageUrl,
        url: formData.url,
        type: formData.type as ComponentItem['type'],
        category: formData.category
      };

      // Add to Firebase or use mock in development
      if (process.env.NODE_ENV === 'development') {
        // Simulate adding to database in development
        console.log('Adding component (mock):', componentData);
        setTimeout(() => {
          setIsSubmitting(false);
          router.push('/dashboard/components');
        }, 1000);
      } else {
        // Add to real Firebase database
        await addComponentToFeed(componentData);
        setIsSubmitting(false);
        router.push('/dashboard/components');
      }
    } catch (error) {
      setError('Failed to add component. Please try again.');
      setIsSubmitting(false);
      console.error('Error adding component:', error);
    }
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to access this page</h1>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Add Component</h1>
        <p className="text-gray-400 mt-2">Add a new component to the inspiration feed</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard/components')}
            className="px-4 py-2 bg-[#2a2545] text-white rounded-lg hover:bg-[#352f57] transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="bg-[#2a2545] rounded-lg shadow-xl border border-[#352f57] p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Component Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-neutral-300 mb-2">
                  Component Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="Full App">Full App</option>
                  <option value="Screen">Screen</option>
                  <option value="Marketing Page">Marketing Page</option>
                  <option value="UI Element">UI Element</option>
                  <option value="Flow">Flow</option>
                </select>
              </div>
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  rows={3}
                  required
                />
              </div>
              
              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-neutral-300 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              {/* Image URL */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-neutral-300 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Leave blank to use a placeholder image
                </p>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#1e1a36] border border-[#352f57] rounded-lg px-4 py-2 text-white"
                  placeholder="Business, Design, Productivity, etc."
                  required
                />
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Adding Component...</span>
                    </div>
                  ) : (
                    'Add Component'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 