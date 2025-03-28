'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the user type
interface UserProfile {
  id: string;
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users except the current user
  useEffect(() => {
    async function fetchUsers() {
      if (!user) return;
      
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '!=', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedUsers: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Only add users that have both name and username
          if (userData.displayName && userData.username) {
            fetchedUsers.push({
              id: doc.id,
              uid: userData.uid,
              name: userData.displayName,
              username: userData.username,
              photoURL: userData.photoURL,
            });
          }
        });
        
        setUsers(fetchedUsers);
        
        // Get a few random users for recommendations
        const shuffled = [...fetchedUsers].sort(() => 0.5 - Math.random());
        setRecommendedUsers(shuffled.slice(0, 3));
        
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [user]);

  // Filter users based on search term
  const filteredResults = searchTerm 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top navigation and search bar */}
      <div className="border-b border-[#2f3336] sticky top-0 bg-black bg-opacity-90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center">
          {/* Search bar */}
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#202327] text-white placeholder-gray-500 border border-transparent rounded-full py-2 pl-10 pr-4 focus:outline-none focus:bg-black focus:border-[#C8C3BC]"
              autoFocus
            />
            <div className="absolute left-3 top-2.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main search results column */}
        <div className="md:col-span-2 mt-4">
          {/* Tabs */}
          <div className="flex border-b border-[#2f3336] mb-2">
            <div className="text-center py-4 px-4 border-b-4 border-[#C8C3BC] font-medium text-[#C8C3BC]">
              For You
            </div>
            <div className="text-center py-4 px-4 text-gray-500 hover:bg-[#181818] cursor-pointer">
              Trending
            </div>
            <div className="text-center py-4 px-4 text-gray-500 hover:bg-[#181818] cursor-pointer">
              News
            </div>
            <div className="text-center py-4 px-4 text-gray-500 hover:bg-[#181818] cursor-pointer">
              Entertainment
            </div>
          </div>

          {/* Search results */}
          <div className="space-y-1">
            {loading ? (
              <div className="py-8 text-center text-gray-500">
                Loading users...
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map(result => (
                <div key={result.id} className="p-4 hover:bg-[#181818] cursor-pointer border-b border-[#2f3336]">
                  <div className="flex">
                    <div className="w-12 h-12 rounded-full bg-[#333639] flex items-center justify-center text-white shrink-0 overflow-hidden">
                      {result.photoURL ? (
                        <img src={result.photoURL} alt={result.name} className="w-full h-full object-cover" />
                      ) : (
                        result.name.charAt(0)
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <div className="font-bold text-white hover:underline">{result.name}</div>
                      </div>
                      <div className="text-gray-500">@{result.username}</div>
                      {/* We could add user bio or other info here in the future */}
                    </div>
                    <button className="ml-4 bg-[#C8C3BC] text-black font-bold rounded-full px-4 py-1.5 hover:bg-opacity-90">
                      Follow
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Who to follow */}
        <div className="mt-4">
          <div className="bg-[#16181c] rounded-2xl overflow-hidden mb-4">
            <h2 className="text-xl font-bold px-4 py-3 border-b border-[#2f3336]">
              Who to follow
            </h2>
            <div>
              {loading ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  Loading recommendations...
                </div>
              ) : recommendedUsers.length > 0 ? (
                recommendedUsers.map(profile => (
                  <div key={profile.id} className="px-4 py-3 hover:bg-[#1e2126] transition-colors flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#333639] flex items-center justify-center text-white shrink-0 overflow-hidden">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        profile.name.charAt(0)
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="font-bold text-white truncate hover:underline">{profile.name}</div>
                      </div>
                      <div className="text-gray-500 truncate">@{profile.username}</div>
                    </div>
                    <button className="ml-4 bg-[#C8C3BC] text-black font-bold rounded-full px-4 py-1.5 hover:bg-opacity-90 shrink-0">
                      Follow
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  No recommendations available
                </div>
              )}
            </div>
            {recommendedUsers.length > 0 && (
              <div className="px-4 py-3 text-[#C8C3BC] hover:bg-[#1e2126] transition-colors cursor-pointer">
                Show more
              </div>
            )}
          </div>
          
          {/* Footer links */}
          <div className="px-4 text-xs text-gray-500">
            <div className="flex flex-wrap gap-2 mb-2">
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Cookie Policy</a>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <a href="#" className="hover:underline">Accessibility</a>
              <a href="#" className="hover:underline">Ads info</a>
              <a href="#" className="hover:underline">More...</a>
            </div>
            <div>© 2023 SiteStack</div>
          </div>
        </div>
      </div>
    </div>
  );
}
