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
    const siteName = cookieStore.get('siteName')?.value;
    
    if (!cloudId) {
      return NextResponse.json({ error: 'No cloudId found' }, { status: 401 });
    }
    
    // Fetch projects using the cached cloudId
    safeLog({}, 'Fetching projects from Jira API v3...');
    const projectsResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    safeLog({}, 'Fetched projects from Jira API v3');
    
    // Return the projects with metadata
    return NextResponse.json({
      success: true,
      cloudId: cloudId,
      siteName: siteName,
      totalProjects: projectsResponse.data.length,
      projects: projectsResponse.data
    });

  } catch (error: any) {
    safeLog({ error: error.message, status: error.response?.status }, 'Projects fetch error');
    
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ error: 'Insufficient permissions to access projects' }, { status: 403 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to fetch projects', 
        details: error.response?.data || error.message 
      }, { status: 500 });
    }
  }
}