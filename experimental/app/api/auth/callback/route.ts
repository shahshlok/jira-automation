import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { fetchAccessibleResources, safeLog } from '@/lib/backend/jiraHelpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
  }
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  
  // Validate state parameter for CSRF protection
  if (!state || state !== storedState) {
    return NextResponse.json({ error: 'Invalid state parameter - possible CSRF attack' }, { status: 400 });
  }
  
  // Clear the state cookie after validation
  cookieStore.delete('oauth_state');

  try {
    // Exchange code for access token
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      code: code, 
      redirect_uri: process.env.REDIRECT_URI!
    });

    const tokenResponse = await axios.post('https://auth.atlassian.com/oauth/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;
    
    // Fetch and cache cloudId
    safeLog({}, 'Fetching accessible resources to cache cloudId...');
    const resourcesData = await fetchAccessibleResources(access_token);

    // Store cloudId and site info in cookies
    const primarySite = resourcesData[0];
    cookieStore.set('jira_auth', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    cookieStore.set('cloudId', primarySite.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60
    });
    
    cookieStore.set('siteName', primarySite.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60
    });
    
    safeLog({}, 'CloudId cached in cookies');
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${frontendUrl}/`);
  } catch (error: any) {
    safeLog({ error: error.message }, 'OAuth callback error');
    return NextResponse.json({ 
      error: 'Authentication failed', 
      details: error.response?.data || error.message 
    }, { status: 500 });
  }
}