import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

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
    if (!src) {
      setHasError(true);
      setLoading(false);
      return;
    }

    setImgSrc(src);
    setLoading(false);
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