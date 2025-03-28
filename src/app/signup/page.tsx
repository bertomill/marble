'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page with a parameter that will open the signup form
    router.push('/login?mode=signup');
  }, [router]);

  return null; // No need to render anything as we're redirecting
}