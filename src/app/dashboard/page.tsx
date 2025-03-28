'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { PlusIcon } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { addSampleProject } from '../../lib/addSampleProject';

// Project type definition
interface Project {
  id: string;
  name: string;
  url?: string;
  visibility: 'Public' | 'Private';
  createdAt: Date;
  businessInfo?: {
    businessType?: string;
    industry?: string;
    targetAudience?: string;
    [key: string]: string | string[] | undefined;
  };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTestProject, setIsAddingTestProject] = useState(false);
  const { user } = useAuth(); // Get authenticated user from context

  // Add a test project for debugging
  const handleAddTestProject = async () => {
    if (!user) {
      setError('You must be logged in to add a test project');
      return;
    }
    
    setIsAddingTestProject(true);
    try {
      await addSampleProject(user.uid);
      setError(null);
      // Refresh the projects list
      fetchProjects();
    } catch (err) {
      console.error('Error adding test project:', err);
      setError('Failed to add test project. Please check console for details.');
    } finally {
      setIsAddingTestProject(false);
    }
  };

  // Fetch user projects from Firestore
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      if (!db) {
        // If Firebase isn't initialized yet, use mock data
        throw new Error("Firebase not initialized");
      }
      
      // Only fetch projects if user is logged in
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(projectsQuery);
      
      const fetchedProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProjects.push({
          id: doc.id,
          name: data.name,
          url: data.url || undefined,
          visibility: data.visibility || 'Private',
          createdAt: data.createdAt instanceof Timestamp ? 
            new Date(data.createdAt.seconds * 1000) : 
            new Date(),
          businessInfo: data.businessInfo || {}
        });
      });
      
      setProjects(fetchedProjects);
      
      // If no real projects exist yet, show mock data for demo purposes
      if (fetchedProjects.length === 0) {
        setProjects([
          {
            id: '1',
            name: 'My First Website',
            url: 'example-first-site.com',
            visibility: 'Public',
            createdAt: new Date('2023-10-15')
          },
          {
            id: '2',
            name: 'E-commerce Store',
            url: 'my-cool-store.com',
            visibility: 'Public',
            createdAt: new Date('2023-11-20')
          },
          {
            id: '3',
            name: 'Client Project',
            url: 'client-project-draft.com',
            visibility: 'Private',
            createdAt: new Date('2023-12-05')
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
      // Fall back to mock data
      setProjects([
        {
          id: '1',
          name: 'My First Website',
          url: 'example-first-site.com',
          visibility: 'Public',
          createdAt: new Date('2023-10-15')
        },
        {
          id: '2',
          name: 'E-commerce Store',
          url: 'my-cool-store.com',
          visibility: 'Public',
          createdAt: new Date('2023-11-20')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]); // Add user as dependency to re-fetch when user changes

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {user && (
            <button 
              onClick={handleAddTestProject}
              disabled={isAddingTestProject} 
              className="px-4 py-2 bg-secondary hover:bg-accent text-secondary-foreground rounded-lg flex items-center gap-2 transition-colors"
            >
              {isAddingTestProject ? 'Adding...' : 'Add Test Project'}
            </button>
          )}
          <Link href="/dashboard/new-site">
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg flex items-center gap-2 transition-colors">
              <PlusIcon className="h-4 w-4" />
              New Project
            </button>
          </Link>
        </div>
      </div>

      {!user ? (
        <div className="mt-8 border rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view and manage your projects.
          </p>
          <Link href="/login">
            <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg mx-auto transition-colors">
              Log In
            </button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-8 p-4 border border-destructive/30 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <caption className="caption-bottom mt-4 text-sm text-muted-foreground">
                  A list of your projects.
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left font-semibold w-[300px]">Name</th>
                    <th className="py-3 px-4 text-left font-semibold">URL</th>
                    <th className="py-3 px-4 text-left font-semibold">Visibility</th>
                    <th className="py-3 px-4 text-left font-semibold">Created</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{project.name}</td>
                      <td className="py-3 px-4">
                        {project.url ? (
                          <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                            <span className="mr-1">🌐</span>
                            {project.url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">Not published</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="mr-1">{project.visibility === 'Private' ? '🔒' : '🌐'}</span>
                          {project.visibility}
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatDate(project.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/project/${project.id}`}>
                          <button className="px-3 py-1 border border-border rounded text-sm hover:bg-muted/50">
                            Manage
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {projects.length === 0 && !isLoading && !error && (
            <div className="mt-8 border border-border rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first project
              </p>
              <Link href="/dashboard/new-site">
                <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg mx-auto transition-colors">
                  Create Project
                </button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
} 