import { useState, useEffect } from 'react';
import { TourStep } from '@/components/ui/tour';

type UseTourOptions = {
  steps: TourStep[];
  initialOpen?: boolean;
  storageKey?: string;
  shouldStart?: () => boolean;
};

export function useTour({
  steps,
  initialOpen = false,
  storageKey = 'app-tour-completed',
  shouldStart = () => true,
}: UseTourOptions) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    // Don't automatically show tour on server-side
    if (typeof window === 'undefined') return;
    
    const hasCompletedTour = localStorage.getItem(storageKey) === 'true';
    
    // Only start the tour if:
    // 1. It hasn't been completed before (or initialOpen is true)
    // 2. shouldStart returns true (e.g., you might want to check if user is on correct page)
    if ((initialOpen || !hasCompletedTour) && shouldStart()) {
      setOpen(true);
    }
  }, [initialOpen, storageKey, shouldStart]);
  
  const completeTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };
  
  const resetTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };
  
  const startTour = () => {
    setOpen(true);
  };
  
  return {
    steps,
    open,
    setOpen,
    completeTour,
    resetTour,
    startTour,
  };
} 