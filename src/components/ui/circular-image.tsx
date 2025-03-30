import Image from 'next/image';
import { cn } from "@/lib/utils";

interface CircularImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function CircularImage({ 
  src, 
  alt, 
  size = 300, 
  className,
  priority = false
}: CircularImageProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-full", 
        className
      )}
      style={{ 
        width: size, 
        height: size 
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        style={{ objectFit: 'cover' }}
        priority={priority}
      />
    </div>
  );
} 