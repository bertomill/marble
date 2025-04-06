'use client';

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

export default function CreateProject({ startTour }: { startTour?: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Add project to Firestore
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }
      
      await addDoc(collection(db, 'projects'), {
        name,
        description,
        status: 'In Progress',
        progress: 0,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      setError('Error creating project. Please try again.');
      console.error('Error creating project:', err);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          {startTour && <TourButton onClick={startTour} />}
        </div>
        
        <div className="bg-card rounded-lg border border-border/50 p-6 shadow-sm dark:border-border/30 dark:bg-card/50">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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