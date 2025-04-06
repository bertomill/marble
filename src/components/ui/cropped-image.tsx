import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface CroppedImageProps {
  src: string;
  alt: string;
  className?: string;
  isValid?: boolean;
  cropBottom?: number; // percentage to crop from bottom (default: 5%)
}

export function CroppedImage({ 
  src, 
  alt, 
  className = "",
  isValid = true,
  cropBottom = 5
}: CroppedImageProps) {
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
            // If we can't extract the path properly, try with the original URL
            try {
              const storageRef = ref(storage, src);
              const downloadUrl = await getDownloadURL(storageRef);
              setImgSrc(downloadUrl);
              setHasError(false);
              setLoading(false);
              return;
            } catch (error) {
              console.error("Error getting download URL for direct path:", error);
              // Fallback to direct URL
              setImgSrc(src);
              setLoading(false);
              return;
            }
          }
          
          try {
            // Get the download URL from Firebase Storage with proper authentication
            const storageRef = ref(storage, storagePath);
            const downloadUrl = await getDownloadURL(storageRef);
            setImgSrc(downloadUrl);
          } catch (error) {
            console.error("Firebase storage error:", error);
            // Fallback to direct URL
            setImgSrc(src);
          }
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      ) : (
        <div 
          className={cn("relative overflow-hidden", className)}
          style={{
            height: "100%",
            width: "100%"
          }}
        >
          <img
            src={imgSrc}
            alt={alt}
            className="w-full h-full object-cover object-top"
            style={{ 
              clipPath: `inset(0 0 ${cropBottom}% 0)`, // Crop the bottom percentage
              transform: `scale(1.${Math.floor(cropBottom / 2)})` // Slightly scale image to compensate for cropping
            }}
            onError={() => {
              console.warn(`Failed to load image: ${src}`);
              setHasError(true);
            }}
            loading="lazy"
          />
        </div>
      )}
    </>
  );
} 