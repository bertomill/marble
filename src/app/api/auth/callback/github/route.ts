import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithCredential, GithubAuthProvider } from 'firebase/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liTJRuTc3S0RW9kA',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '51472156d22b861153869f947dd7468403180320',
        code: code,
        // Add the redirect_uri that exactly matches what's configured in GitHub
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.marble.dev'}/api/auth/callback/github`
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error);
      return NextResponse.redirect(new URL(`/login?error=${tokenData.error}`, request.url));
    }

    // Use the access token with Firebase
    const credential = GithubAuthProvider.credential(tokenData.access_token);
    await signInWithCredential(auth, credential);

    // Redirect to dashboard on successful authentication
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
  }
} 