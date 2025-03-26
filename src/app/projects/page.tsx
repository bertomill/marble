'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { PlusIcon } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get authenticated user from context

  // Fetch user projects from Firestore
  useEffect(() => {
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
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <Link href="/dashboard/new-site">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <PlusIcon className="h-4 w-4" />
            New Project
          </button>
        </Link>
      </div>

      {!user ? (
        <div className="mt-8 border rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Please log in</h2>
          <p className="text-gray-500 mb-6">
            You need to be logged in to view and manage your projects.
          </p>
          <Link href="/login">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg mx-auto transition-colors">
              Log In
            </button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-8 p-4 border border-red-300 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 w-full bg-gray-200 animate-pulse rounded"></div>
              <div className="h-12 w-full bg-gray-200 animate-pulse rounded"></div>
              <div className="h-12 w-full bg-gray-200 animate-pulse rounded"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <caption className="caption-bottom mt-4 text-sm text-gray-500">
                  A list of your projects.
                </caption>
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-semibold w-[300px]">Name</th>
                    <th className="py-3 px-4 text-left font-semibold">URL</th>
                    <th className="py-3 px-4 text-left font-semibold">Visibility</th>
                    <th className="py-3 px-4 text-left font-semibold">Created</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{project.name}</td>
                      <td className="py-3 px-4">
                        {project.url ? (
                          <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            <span className="mr-1">🌐</span>
                            {project.url}
                          </a>
                        ) : (
                          <span className="text-gray-500 italic">Not published</span>
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
                          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
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

          {!isLoading && projects.length === 0 && (
            <div className="mt-8 border rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-6">
                Create your first website project to get started.
              </p>
              <Link href="/dashboard/new-site">
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors">
                  <PlusIcon className="h-4 w-4" />
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