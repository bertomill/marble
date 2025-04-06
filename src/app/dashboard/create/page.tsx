'use client';

// Import necessary React hooks and components
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { TourButton } from '../TourWrapper';

// Main form component for creating new projects
function CreateProjectForm() {
  // State management for form fields and UI
  const [name, setName] = useState(''); // Stores the project name
  const [description, setDescription] = useState(''); // Stores the project description
  const [loading, setLoading] = useState(false); // Tracks form submission state
  const [error, setError] = useState(''); // Stores any error messages
  const router = useRouter(); // Router for navigation

  // Check user authentication status on component mount
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Redirect to login if no user is found
      if (!user) {
        router.push('/login');
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form behavior
    
    // Validate project name
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    try {
      setLoading(true); // Show loading state
      setError(''); // Clear any previous errors
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Create new project in Firestore
      await addDoc(collection(db, 'projects'), {
        name,
        description,
        status: 'In Progress',
        progress: 0,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setLoading(false); // Hide loading state
      router.push('/dashboard'); // Navigate to dashboard
    } catch (err) {
      setLoading(false); // Hide loading state
      setError('Error creating project. Please try again.'); // Show error message
      console.error('Error creating project:', err); // Log error
    }
  };

  // Render the form UI
  return (
    <>
      <div className="max-w-2xl mx-auto py-6">
        {/* Header section with back button and tour button */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <TourButton />
        </div>
        
        {/* Main form container */}
        <div className="bg-card rounded-lg border border-border/50 p-6 shadow-sm dark:border-border/30 dark:bg-card/50">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          
          {/* Error message display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {/* Project creation form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project name input field */}
            <div className="space-y-2 project-name-field">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                disabled={loading}
                className="w-full"
              />
            </div>
            
            {/* Project description input field */}
            <div className="space-y-2 project-description-field">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                disabled={loading}
                className="w-full min-h-32"
              />
            </div>
            
            {/* Submit button */}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full create-project-button"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

// Export the page component
export default function CreateProjectPage() {
  return <CreateProjectForm />;
}