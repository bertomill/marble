"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login?mode=signup');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 to-neutral-950">
      <div className="text-white text-center">
        <div className="mb-4">Redirecting to sign up...</div>
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full mx-auto"></div>
      </div>
    </div>
  );
} 