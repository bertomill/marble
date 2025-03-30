import { NextRequest, NextResponse } from 'next/server';
import { auth, githubProvider } from '@/lib/firebase';
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
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
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