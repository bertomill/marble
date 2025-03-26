'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout, userPreferences, updateUserPreferences } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editableInterests, setEditableInterests] = useState<string[]>([]);
  
  useEffect(() => {
    // Check if user is authenticated
    if (user === null) {
      router.push('/login');
    } else {
      setIsLoading(false);
      // Initialize editable interests from user preferences
      setEditableInterests(userPreferences.interests || []);
    }
  }, [user, router, userPreferences.interests]);
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleInterest = (interest: string) => {
    setEditableInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const saveInterests = () => {
    updateUserPreferences({ interests: editableInterests });
    setIsEditingInterests(false);
  };

  const cancelEditInterests = () => {
    setEditableInterests(userPreferences.interests || []);
    setIsEditingInterests(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-neutral-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Define available interests (same as onboarding)
  const INTEREST_CATEGORIES = [
    'E-commerce', 'SaaS', 'Technology', 'Finance', 'Healthcare', 
    'Education', 'Real Estate', 'Marketing', 'Travel', 'Food & Beverage',
    'Fashion', 'Beauty', 'Fitness', 'Entertainment', 'Media',
    'Manufacturing', 'Professional Services', 'Non-profit', 'Art & Design'
  ];
  
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#2a2545] rounded-lg shadow-md p-8 border border-[#352f57] animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-white">Your Profile</h1>
              <button
                onClick={handleLogout}
                className="bg-[#1e1a36] text-neutral-300 py-2 px-4 rounded-lg hover:bg-[#352f57] transition-colors"
              >
                Log Out
              </button>
            </div>
            
            <div className="border-b border-[#352f57] pb-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-900/30 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                  <span className="text-indigo-400 text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {user?.displayName || user?.email?.split('@')[0] || 'SiteStack User'}
                  </h2>
                  <p className="text-neutral-300">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                  Edit Profile
                </button>
                <button className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
                  Change Password
                </button>
              </div>
            </div>
            
            {/* Interests section */}
            <div className="mb-8 border-b border-[#352f57] pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Your Interests</h3>
                {!isEditingInterests ? (
                  <button 
                    onClick={() => setIsEditingInterests(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Edit Interests
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button 
                      onClick={cancelEditInterests}
                      className="text-sm text-neutral-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveInterests}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditingInterests ? (
                <div className="flex flex-wrap gap-2">
                  {userPreferences.interests && userPreferences.interests.length > 0 ? (
                    userPreferences.interests.map(interest => (
                      <span 
                        key={interest} 
                        className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-neutral-400 text-sm">No interests selected yet. Complete onboarding or edit your interests.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-neutral-300 text-sm mb-2">Select the topics you're interested in:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-stagger">
                    {INTEREST_CATEGORIES.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors animate-fadeInUp opacity-0 ${
                          editableInterests.includes(interest)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[#1e1a36] text-neutral-300 hover:bg-[#352f57]'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Saved Websites section */}
            <div className="mb-8 border-b border-[#352f57] pb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Saved Websites</h3>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Manage Websites
                </button>
              </div>
              
              {userPreferences.suggestedWebsites && userPreferences.suggestedWebsites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userPreferences.suggestedWebsites.map(website => (
                    <div 
                      key={website}
                      className="p-3 rounded-lg bg-[#1e1a36] border border-[#352f57] hover:border-indigo-500/50 transition-colors"
                    >
                      <a 
                        href={website.startsWith('http') ? website : `https://${website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:text-indigo-300 transition-colors"
                      >
                        {website}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400 text-sm">No websites saved yet.</p>
              )}
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Email</p>
                  <p className="text-base text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Account Created</p>
                  <p className="text-base text-white">
                    {user?.metadata?.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Last Sign In</p>
                  <p className="text-base text-white">
                    {user?.metadata?.lastSignInTime 
                      ? new Date(user.metadata.lastSignInTime).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Email Verified</p>
                  <p className="text-base text-white">
                    {user?.emailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Link 
                href="/dashboard" 
                className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 