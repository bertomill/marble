'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Search,
  Heart,
  MessageSquare,
  Share2,
  Filter,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CroppedImage } from "@/components/ui/cropped-image";

// Image component with fallback
const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "",
  isValid = true
}: { 
  src: string; 
  alt: string; 
  className?: string;
  isValid?: boolean;
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(!isValid);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadImage() {
      if (!src) {
        setHasError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Check if URL is a Firebase Storage URL
        if (src.includes('sitestack-30e64.firebasestorage.app') || src.includes('firebasestorage.googleapis.com')) {
          // Extract the path from the URL
          let storagePath = '';
          
          if (src.includes('/screenshots/')) {
            // Get the path after "/screenshots/"
            storagePath = 'screenshots/' + src.split('/screenshots/')[1];
            // Handle URL encoding
            storagePath = decodeURIComponent(storagePath);
          } else {
            // Use the full URL as fallback
            setImgSrc(src);
            setLoading(false);
            return;
          }
          
          console.log('Loading from Firebase Storage:', storagePath);
          // Get the download URL from Firebase Storage
          const storageRef = ref(storage, storagePath);
          const downloadUrl = await getDownloadURL(storageRef);
          setImgSrc(downloadUrl);
        } else {
          // Regular URL
          setImgSrc(src);
        }
        setHasError(false);
      } catch (error) {
        console.error(`Error loading image (${src}):`, error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [src]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      {hasError ? (
        <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
          <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          onError={() => {
            console.warn(`Failed to load image: ${src}`);
            setHasError(true);
          }}
          loading="lazy"
        />
      )}
    </>
  );
};

interface Screenshot {
  id: string;
  altText: string;
  captureDate: string;
  category: string;
  createdAt: string;
  description: string;
  extractedText: string;
  filename: string;
  imageUrl: string;
  platform: string;
  referenceNumber: string;
  siteName: string;
  tags: string[];
  score?: number;
}

export default function ExplorePage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [validatedUrls, setValidatedUrls] = useState<Record<string, boolean>>({});

  // Validate image URLs to ensure they can be fetched
  const validateImageUrls = async (screenshots: Screenshot[]) => {
    const urlValidationMap: Record<string, boolean> = {};
    
    // Process screenshots with imageUrl
    const screenshotsWithUrls = screenshots.filter(s => s.imageUrl && typeof s.imageUrl === 'string');
    
    // Only process up to 10 images at once to avoid rate limiting
    for (const screenshot of screenshotsWithUrls.slice(0, 10)) {
      try {
        // Check if URL is valid by sending a HEAD request
        const response = await fetch(screenshot.imageUrl, { 
          method: 'HEAD',
          // Short timeout so we don't hang waiting for responses
          signal: AbortSignal.timeout(3000)
        });
        urlValidationMap[screenshot.id] = response.ok;
        if (!response.ok) {
          console.warn(`Image URL validation failed for ${screenshot.id}: ${screenshot.imageUrl}`);
        }
      } catch (error) {
        console.warn(`Image URL validation error for ${screenshot.id}:`, error);
        urlValidationMap[screenshot.id] = false;
      }
    }
    
    setValidatedUrls(prev => ({ ...prev, ...urlValidationMap }));
  };

  // Fetch initial screenshots
  const fetchScreenshots = async (isLoadingMore = false) => {
    try {
      setLoading(!isLoadingMore);
      if (isLoadingMore) setLoadingMore(true);
      
      const screenshotsRef = collection(db, 'screenshots');
      let q = query(
        screenshotsRef,
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      if (isLoadingMore && lastVisible) {
        q = query(
          screenshotsRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(12)
        );
      }

      const querySnapshot = await getDocs(q);
      const newScreenshots = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure imageUrl is valid
        if (!data.imageUrl || typeof data.imageUrl !== 'string') {
          console.warn(`Screenshot ${doc.id} has invalid imageUrl:`, data.imageUrl);
        }
        return {
          id: doc.id,
          ...data
        } as Screenshot;
      });

      if (isLoadingMore) {
        setScreenshots(prev => [...prev, ...newScreenshots]);
      } else {
        setScreenshots(newScreenshots);
      }

      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === 12);
      } else {
        setHasMore(false);
      }

      await validateImageUrls(newScreenshots);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Semantic search function
  const performSemanticSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setSearchLoading(true);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setScreenshots(data.results);
      setHasMore(false); // Disable infinite loading for semantic search results
      
      // Validate image URLs in the search results
      await validateImageUrls(data.results);
    } catch (error) {
      console.error('Semantic search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, []);

  // Handle search
  useEffect(() => {
    if (!isSemanticSearch) {
      if (searchTerm === '') {
        fetchScreenshots();
      }
      // Regular search is handled through filteredScreenshots
    }
  }, [searchTerm, isSemanticSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSemanticSearch) {
      await performSemanticSearch(searchTerm);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchScreenshots(true);
  };

  // Filter screenshots based on search and category (for non-semantic search)
  const filteredScreenshots = !isSemanticSearch ? screenshots.filter(screenshot => {
    const matchesSearch = searchTerm === '' || 
      screenshot.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screenshot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screenshot.altText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screenshot.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || screenshot.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) : screenshots;

  // Get unique categories
  const categories = Array.from(new Set(screenshots.map(s => s.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explore Screenshots</h1>
          <p className="text-muted-foreground">Discover and get inspired by other websites</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          {isSemanticSearch ? (
            <form onSubmit={handleSearch} className="flex-1 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <div className="relative">
                <Input
                  placeholder="Ask me to find specific design patterns, layouts, or features..."
                  className="pr-24"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 bottom-1"
                  disabled={searchLoading || !searchTerm.trim()}
                >
                  {searchLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    "Ask AI"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Examples: "Find login pages with dark themes", "Show me pricing tables with monthly/yearly toggle"
              </p>
            </form>
          ) : (
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Keyword Search</span>
              </div>
              <div className="relative">
                <Input
                  placeholder="Search by site name, description, or tags..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 md:pt-8">
            <Switch
              checked={isSemanticSearch}
              onCheckedChange={setIsSemanticSearch}
              id="semantic-search"
            />
            <Label htmlFor="semantic-search" className="flex items-center gap-1.5 cursor-pointer">
              {isSemanticSearch ? "Switch to Keyword Search" : "Switch to AI Search"}
            </Label>
          </div>
        </div>
        
        {!isSemanticSearch && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Screenshots Grid */}
      {(loading || searchLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredScreenshots.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScreenshots.map((screenshot) => (
              <Card key={screenshot.id} className="overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {screenshot.imageUrl ? (
                    <div className="w-full h-full relative">
                      <CroppedImage
                        src={screenshot.imageUrl}
                        alt={screenshot.altText || screenshot.siteName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        isValid={screenshot.id in validatedUrls ? validatedUrls[screenshot.id] : true}
                        cropBottom={5}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-black/60 text-white">
                          {screenshot.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <Button size="icon" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                      <ExternalLink className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium line-clamp-1">{screenshot.siteName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {screenshot.description || screenshot.altText}
                      </p>
                      {isSemanticSearch && screenshot.score && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Relevance: {Math.round(screenshot.score * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-4">
                  {screenshot.tags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </CardFooter>
              </Card>
            ))}
          </div>
          {hasMore && !isSemanticSearch && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="min-w-[200px]"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No screenshots found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
} 