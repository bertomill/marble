import { NextRequest, NextResponse } from 'next/server';

// Paths that don't require checking onboarding status
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/onboarding', 
  '/api',
  '/_next',
  '/favicon.ico',
];

// Check if a path is public
const isPublicPath = (path: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Get onboarding status from cookie
  const onboardingComplete = request.cookies.get('onboardingComplete')?.value === 'true';
  
  // Check if user is logged in via cookie
  const isLoggedIn = request.cookies.has('authToken');
  
  // If not logged in, redirect to login
  if (!isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If logged in but hasn't completed onboarding, redirect to onboarding
  if (isLoggedIn && !onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}; 