import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { safeLog } from '@/lib/backend/jiraHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectKey: string }> }
) {
  const { projectKey } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('jira_auth')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!projectKey) {
    return NextResponse.json({ error: 'Project key is required' }, { status: 400 });
  }

  try {
    const cloudId = cookieStore.get('cloudId')?.value;
    
    if (!cloudId) {
      return NextResponse.json({ error: 'No cloudId found' }, { status: 401 });
    }
    
    // Fetch stories using JQL search
    safeLog({}, `Fetching stories for project ${projectKey} from Jira API v3...`);
    const storiesResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        jql: `project=${projectKey} AND issuetype=Story AND parent IS NOT EMPTY`
      }
    });
    
    safeLog({}, `Fetched ${storiesResponse.data.issues.length} stories for project ${projectKey}`);
    
    // Return the stories with metadata
    return NextResponse.json({
      success: true,
      projectKey: projectKey,
      totalStories: storiesResponse.data.issues.length,
      rawResponse: storiesResponse.data
    });

  } catch (error: any) {
    safeLog({ error: error.message, status: error.response?.status }, 'Stories fetch error');
    
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ error: 'Insufficient permissions to access stories' }, { status: 403 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to fetch stories', 
        details: error.response?.data || error.message 
      }, { status: 500 });
    }
  }
}