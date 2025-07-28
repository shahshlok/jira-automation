import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in cookie for validation (Next.js doesn't have sessions by default)
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 // 10 minutes
  });
  
  // Get the redirect URI from environment or construct it dynamically
  const redirectUri = process.env.REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.CLIENT_ID}&scope=read%3Ajira-work%20read%3Ajira-user%20manage%3Ajira-configuration&redirect_uri=${encodedRedirectUri}&state=${state}&response_type=code&prompt=consent`;

  return NextResponse.redirect(authUrl);
}