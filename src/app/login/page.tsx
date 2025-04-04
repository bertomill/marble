"use client";

import { useState, useEffect, Suspense } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { GithubAuthProvider } from 'firebase/auth';

function LoginForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const router = useRouter();

  // Update URL when mode changes without refreshing page
  useEffect(() => {
    const newUrl = isSignUp 
      ? `${window.location.pathname}?mode=signup` 
      : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
  }, [isSignUp]);

  // Toggle between login and signup modes
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate passwords match for signup
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        
        // Create new user
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof FirebaseError 
        ? err.message 
        : isSignUp ? 'Failed to sign up' : 'Failed to sign in';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof FirebaseError 
        ? err.message 
        : `Failed to ${isSignUp ? 'sign up' : 'sign in'} with Google`;
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      // Get the GitHub authentication URL
      const provider = new GithubAuthProvider();
      const redirectUrl = `${window.location.origin}/api/auth/callback/github`;
      
      // Set the custom redirect URL in the provider
      provider.setCustomParameters({
        redirect_uri: redirectUrl
      });
      
      // Instead of popup, use redirect flow
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=user:email`;
    } catch (err) {
      const errorMessage = err instanceof FirebaseError 
        ? err.message 
        : `Failed to ${isSignUp ? 'sign up' : 'sign in'} with GitHub`;
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Video Banner (only visible on mobile) */}
      <div className="md:hidden relative h-32 w-full overflow-hidden">
        <video 
          className="absolute top-0 left-0 w-full h-full object-cover" 
          src="/videos/hero_video.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline
        />
        <div className="absolute top-0 left-0 w-full h-full bg-stone-950/60"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-stone-900/40 backdrop-blur-md border border-stone-500/10 rounded-full flex items-center justify-center">
            <Image 
              src="/marble_logo_circle.png" 
              alt="Marble Logo" 
              width={40} 
              height={40}
            />
          </div>
        </div>
      </div>
      
      {/* Left Panel - Branding Area with Video Background */}
      <div className="hidden md:flex md:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
        {/* Video Background */}
        <video 
          className="absolute top-0 left-0 w-full h-full object-cover z-0" 
          src="/videos/hero_video.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline
        />
        
        {/* Dimming Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-stone-950/70 z-10"></div>
        
        {/* Content positioned over video */}
        <div className="relative z-20">
          <div className="w-24 h-24 bg-stone-900/40 backdrop-blur-md border border-stone-500/10 rounded-full flex items-center justify-center">
            <Image 
              src="/marble_logo_circle.png" 
              alt="Marble Logo" 
              width={60} 
              height={60}
            />
          </div>
        </div>
        
        <div className="space-y-6 relative z-20">
          <h1 className="text-4xl font-bold text-stone-100">
            {isSignUp ? 'Welcome to Marble' : 'Welcome back to Marble'}
          </h1>
          <p className="text-lg text-stone-300 max-w-md">
            {isSignUp 
              ? 'Create your account to start managing your business with ease.' 
              : 'Login to your account to continue managing your business with ease.'}
          </p>
        </div>
        
        <div className="text-stone-400 text-sm relative z-20">
          © {new Date().getFullYear()} Marble. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-stone-900/90 to-stone-950/90 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-8 p-8 rounded-xl border border-stone-500/20 bg-stone-950/50 backdrop-blur-md shadow-xl">
          {/* Mobile title */}
          <div className="md:hidden mb-2">
            <h1 className="text-2xl font-bold text-stone-100 text-center">
              {isSignUp ? 'Welcome to Marble' : 'Welcome back to Marble'}
            </h1>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-stone-100">
              {isSignUp ? 'Sign up to Marble' : 'Login to Marble'}
            </h2>
            <p className="mt-2 text-stone-400">
              {isSignUp 
                ? 'Enter your details to create your account' 
                : 'Enter your details to access your account'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-stone-300">
                Email address
              </label>
              <Input
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 bg-stone-900/70 border-stone-500/20 text-white rounded-md focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400/30"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-stone-300">
                  Password
                </label>
                {!isSignUp && (
                  <Link href="/forgot-password" className="text-xs text-stone-300 hover:text-stone-200 font-medium">
                    Forgot your password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-900/70 border-stone-500/20 text-white rounded-md focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400/30 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-stone-900/70 border-stone-500/20 text-white rounded-md focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400/30 pr-10"
                    required
                  />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-stone-500/20 bg-stone-900/70 text-stone-500 focus:ring-stone-400/30"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-stone-400">
                  Remember me
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-stone-700 hover:bg-stone-600 text-white py-2 rounded-md font-medium transition-colors shadow-md"
              disabled={loading}
            >
              {loading 
                ? (isSignUp ? 'Signing up...' : 'Signing in...') 
                : 'Continue'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-500/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-stone-950/30 text-sm text-stone-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              className="w-full border border-stone-500/20 bg-stone-900/50 text-white hover:bg-stone-800/70 hover:border-stone-400/30 py-2 rounded-md font-medium transition-colors shadow-md"
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                Sign {isSignUp ? 'up' : 'in'} with Google
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGithubAuth}
              className="w-full border border-stone-500/20 bg-stone-900/50 text-white hover:bg-stone-800/70 hover:border-stone-400/30 py-2 rounded-md font-medium transition-colors shadow-md"
              disabled={loading}
            >
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  />
                </svg>
                Sign {isSignUp ? 'up' : 'in'} with GitHub
              </div>
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-stone-400">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-stone-300 hover:text-stone-200">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-stone-300 hover:text-stone-200">
                Privacy Policy
              </Link>
            </p>
            <p className="mt-4 text-stone-400">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={toggleAuthMode}
                    className="text-stone-300 font-medium hover:text-stone-200"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button 
                    onClick={toggleAuthMode}
                    className="text-stone-300 font-medium hover:text-stone-200"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
} 