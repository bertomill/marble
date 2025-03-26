'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

export default function NewScreenPage() {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to save a screen');
      return;
    }
    
    if (!title || !imageUrl) {
      setError('Title and image URL are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      await addDoc(collection(db, 'screens'), {
        title,
        imageUrl,
        sourceUrl: sourceUrl || null,
        tags: tagsArray,
        notes: notes || null,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Reset form
      setTitle('');
      setImageUrl('');
      setSourceUrl('');
      setTags('');
      setNotes('');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/screens');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving screen:', err);
      setError('Failed to save screen. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <Link href="/screens" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Screens</span>
        </Link>
        <h1 className="text-3xl font-bold">Save New Screen</h1>
      </div>

      {!user ? (
        <div className="mt-8 border rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Please log in</h2>
          <p className="text-gray-500 mb-6">
            You need to be logged in to save screens.
          </p>
          <Link href="/login">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mx-auto transition-colors">
              Log In
            </button>
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 border border-green-300 bg-green-50 text-green-600 rounded-lg">
              Screen saved successfully! Redirecting...
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="E.g., Modern Dashboard Design"
                required
              />
            </div>
            
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/screenshot.jpg"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Direct link to the image. You can right-click an image and select "Copy Image Address".
              </p>
            </div>
            
            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Source URL
              </label>
              <input
                type="url"
                id="sourceUrl"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/inspiration-page"
              />
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="dashboard, modern, ui (comma separated)"
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What do you like about this design?"
              ></textarea>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
                  isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Screen'}
              </button>
            </div>
          </form>
          
          {imageUrl && (
            <div className="mt-8 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">Preview:</h3>
              <div className="aspect-video relative bg-gray-100 rounded overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/600x400/ff5252/ffffff?text=Invalid+Image+URL';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 