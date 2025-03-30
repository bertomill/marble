'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, query, limit, orderBy, startAfter, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Search, Filter, X, ExternalLink, Heart, MessageSquare, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SeedData from './seed-data';

interface Screenshot {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  createdAt: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
  tags: string[];
  likes: number;
  comments: number;
  category?: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [totalScreenshots, setTotalScreenshots] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const categories = [
    'UI Design', 'Landing Pages', 'Dashboards', 'E-commerce', 'Mobile Apps', 'Blogs'
  ];
  
  const popularTags = [
    'minimal', 'dark', 'colorful', 'modern', 'creative', 'clean', 'responsive'
  ];

  const fetchTotalCount = async () => {
    try {
      const screenshotsRef = collection(db, 'screenshots');
      const snapshot = await getCountFromServer(screenshotsRef);
      setTotalScreenshots(snapshot.data().count);
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      // Query to get random screenshots, limited to 20
      // For a truly random order in Firestore, we'd need a random field
      // This is a simplified approach that gets a batch in a random-ish order
      const screenshotsRef = collection(db, 'screenshots');
      const randomSeed = Math.floor(Math.random() * 3); // 0, 1, or 2 for different sorting approaches
      
      let q;
      if (randomSeed === 0) {
        q = query(screenshotsRef, orderBy('likes', 'desc'), limit(20));
      } else if (randomSeed === 1) {
        q = query(screenshotsRef, orderBy('title'), limit(20));
      } else {
        q = query(screenshotsRef, orderBy('createdAt', 'desc'), limit(20));
      }
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const screenshotsData: Screenshot[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            imageUrl: data.imageUrl || 'https://placehold.co/600x400/1a1a1a/ffffff?text=Screenshot',
            title: data.title || 'Untitled Screenshot',
            description: data.description,
            createdAt: data.createdAt?.toDate() || new Date(),
            userId: data.userId,
            userName: data.userName || 'Anonymous User',
            userAvatar: data.userAvatar,
            tags: data.tags || [],
            likes: data.likes || 0,
            comments: data.comments || 0,
            category: data.category
          };
        });
        
        setScreenshots(screenshotsData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= 20);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      setLoading(false);
    }
  };

  // Load more screenshots when user scrolls to bottom
  const loadMoreScreenshots = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const screenshotsRef = collection(db, 'screenshots');
      const randomSeed = Math.floor(Math.random() * 3);
      
      let q;
      if (randomSeed === 0) {
        q = query(screenshotsRef, orderBy('likes', 'desc'), startAfter(lastVisible), limit(20));
      } else if (randomSeed === 1) {
        q = query(screenshotsRef, orderBy('title'), startAfter(lastVisible), limit(20));
      } else {
        q = query(screenshotsRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(20));
      }
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const newScreenshots: Screenshot[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            imageUrl: data.imageUrl || 'https://placehold.co/600x400/1a1a1a/ffffff?text=Screenshot',
            title: data.title || 'Untitled Screenshot',
            description: data.description,
            createdAt: data.createdAt?.toDate() || new Date(),
            userId: data.userId,
            userName: data.userName || 'Anonymous User',
            userAvatar: data.userAvatar,
            tags: data.tags || [],
            likes: data.likes || 0,
            comments: data.comments || 0,
            category: data.category
          };
        });
        
        setScreenshots(prev => [...prev, ...newScreenshots]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= 20);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more screenshots:', error);
      setLoadingMore(false);
    }
  }, [hasMore, lastVisible, loadingMore]);

  // Setup intersection observer for infinite scroll
  const lastCardRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore) {
        loadMoreScreenshots();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, loadMoreScreenshots]);

  // Fetch user and screenshots data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchScreenshots();
        fetchTotalCount();
      } else {
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  // Filter screenshots based on search query, category, and tags
  const filteredScreenshots = screenshots.filter(screenshot => {
    const matchesSearch = !searchQuery || 
                         screenshot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (screenshot.description && screenshot.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         screenshot.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || screenshot.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
                        selectedTags.every(tag => screenshot.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Discover</h1>
          <div className="w-64 h-10 bg-muted rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, index) => (
            <Card key={index} className="overflow-hidden bg-[#1a1a1a] border-gray-800">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exploring {totalScreenshots.toLocaleString()} images from our collection
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
            <Input
              type="search"
              placeholder="Search screenshots..."
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
        <Card className="border border-gray-800 bg-[#1a1a1a]">
          <div className="p-4 flex flex-row items-center justify-between border-b border-gray-800">
            <h3 className="text-lg font-medium">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge 
                    key={category} 
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Popular Tags</h4>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {filteredScreenshots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScreenshots.map((screenshot, index) => (
            <Card 
              key={screenshot.id} 
              className="overflow-hidden bg-[#1a1a1a] border-gray-800 flex flex-col"
              ref={index === filteredScreenshots.length - 5 ? lastCardRef : null}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={screenshot.imageUrl} 
                  alt={screenshot.title}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
                {screenshot.category && (
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">{screenshot.category}</Badge>
                )}
              </div>
              
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={screenshot.userAvatar} alt={screenshot.userName} />
                    <AvatarFallback>{screenshot.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{screenshot.userName}</span>
                </div>
                
                <h3 className="text-base font-medium mb-1">{screenshot.title}</h3>
                
                {screenshot.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {screenshot.description}
                  </p>
                )}
                
                {screenshot.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {screenshot.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {screenshot.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{screenshot.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {formatDate(screenshot.createdAt)}
                </div>
              </CardContent>
              
              <CardFooter className="p-3 border-t border-gray-800 flex justify-between items-center">
                <div className="flex gap-3">
                  <button className="text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">{screenshot.likes}</span>
                  </button>
                  <button className="text-muted-foreground hover:text-primary flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">{screenshot.comments}</span>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="text-muted-foreground hover:text-primary">
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No screenshots found</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            {searchQuery || selectedCategory || selectedTags.length > 0 ? 
              "Try adjusting your search or filters" : 
              "There are no screenshots available to discover yet."}
          </p>
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Developer Tools
            </summary>
            <div className="mt-2">
              <SeedData />
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 