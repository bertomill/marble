'use client';

import { useEffect } from 'react';
import { setupAuthListeners } from '@/lib/firebase';

export default function AuthListener() {
  useEffect(() => {
    setupAuthListeners();
  }, []);

  // This component doesn't render anything visible
  return null;
} 