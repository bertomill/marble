'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// User type definition
interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  online: boolean;
  lastActive: string;
  friends?: string[];
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showFilters, setShowFilters] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  // Fetch current user and all users from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // Get current user's data including friends list
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const userFriends = userData?.friends || [];
          
          // Get all users
          const usersRef = collection(db, 'users');
          const usersSnap = await getDocs(usersRef);
          const usersData: User[] = usersSnap.docs
            .map(doc => ({
              id: doc.id,
              displayName: doc.data().displayName || 'Anonymous User',
              email: doc.data().email || '',
              photoURL: doc.data().photoURL || '',
              online: doc.data().status === 'online' || false,
              lastActive: doc.data().lastActive ? new Date(doc.data().lastActive.toDate()).toLocaleString() : 'Unknown',
              friends: doc.data().friends || []
            }))
            .filter(u => u.id !== user.uid); // Exclude current user
          
          // Separate friends and suggestions
          const friendsList = usersData.filter(u => userFriends.includes(u.id));
          const suggestionsList = usersData.filter(u => !userFriends.includes(u.id));
          
          setFriends(friendsList);
          setSuggestions(suggestionsList);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching users:", error);
          setLoading(false);
        }
      } else {
        // User not logged in, redirect to login
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Add a friend
  const addFriend = async (friendId: string) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        friends: arrayUnion(friendId)
      });
      
      // Update local state
      const newFriend = suggestions.find(s => s.id === friendId);
      if (newFriend) {
        setFriends([...friends, newFriend]);
        setSuggestions(suggestions.filter(s => s.id !== friendId));
      }
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  // Remove a friend
  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        friends: arrayRemove(friendId)
      });
      
      // Update local state
      const removedFriend = friends.find(f => f.id === friendId);
      if (removedFriend) {
        setSuggestions([...suggestions, removedFriend]);
        setFriends(friends.filter(f => f.id !== friendId));
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  // Filter friends and suggestions based on search query and filters
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = !searchQuery || 
                         friend.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOnlineFilter = !onlineOnly || friend.online;
    return matchesSearch && matchesOnlineFilter;
  });

  const filteredSuggestions = suggestions.filter(suggestion => 
    !searchQuery || 
    suggestion.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate mutual friends (simplified version - in a real app you'd compute actual mutual connections)
  const getMutualFriendsCount = (userId: string) => {
    // This is a simplified implementation
    return Math.floor(Math.random() * 10);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Find People</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
            <Input
              type="search"
              placeholder="Search by name..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-primary/10" : ""}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <Card className="border border-border">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="onlineOnly"
                  checked={onlineOnly}
                  onChange={() => setOnlineOnly(!onlineOnly)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="onlineOnly" className="text-sm font-medium">
                  Online Only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex space-x-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'friends' 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
          onClick={() => setActiveTab('friends')}
        >
          My Friends ({friends.length})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'users' 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
          onClick={() => setActiveTab('users')}
        >
          All Users ({suggestions.length})
        </button>
      </div>
      
      {activeTab === 'friends' && filteredFriends.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredFriends.map(friend => (
            <Card key={friend.id} className="overflow-hidden bg-[#1a1a1a] border-gray-800">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.photoURL} alt={friend.displayName} />
                      <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{friend.displayName}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={friend.online ? "success" : "secondary"} className="rounded-full px-2 text-xs">
                    {friend.online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {getMutualFriendsCount(friend.id)} mutual friends
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                <Button variant="outline" size="sm">Message</Button>
                <Button variant="ghost" size="sm" onClick={() => removeFriend(friend.id)}>Remove</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {activeTab === 'friends' && filteredFriends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No friends found</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            {searchQuery ? "Try a different search term" : "You don&apos;t have any friends matching the selected filters."}
          </p>
        </div>
      )}
      
      {activeTab === 'users' && filteredSuggestions.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredSuggestions.map(user => (
            <Card key={user.id} className="overflow-hidden bg-[#1a1a1a] border-gray-800">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{user.displayName}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={user.online ? "success" : "secondary"} className="rounded-full px-2 text-xs">
                    {user.online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {getMutualFriendsCount(user.id)} mutual friends
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-end">
                <Button size="sm" onClick={() => addFriend(user.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Friend
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {activeTab === 'users' && filteredSuggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No users found</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            We couldn&apos;t find any users matching your search.
          </p>
        </div>
      )}
    </div>
  );
} 