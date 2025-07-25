import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { safeLog } from '@/lib/backend/jiraHelpers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jira_auth')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const cloudId = cookieStore.get('cloudId')?.value;
    
    if (!cloudId) {
      return NextResponse.json({ error: 'No cloudId found' }, { status: 401 });
    }
    
    const userResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Format the response to match what the frontend expects
    const userData = userResponse.data;
    return NextResponse.json({
      name: userData.displayName || userData.name,
      email: userData.emailAddress,
      account_id: userData.accountId,
      picture: userData.avatarUrls?.['48x48'] || userData.avatarUrls?.['32x32']
    });
  } catch (error: any) {
    safeLog({ error: error.message }, 'User info fetch error');
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}