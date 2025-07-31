import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jira_auth')?.value;
  const cloudId = cookieStore.get('cloudId')?.value;
  
  if (!token || !cloudId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get project info
    const projectResponse = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/PC`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    // Get issue types for the project
    const issueTypesResponse = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issuetype/project?projectId=${projectResponse.data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    // Get create issue metadata
    const metadataResponse = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/createmeta?projectKeys=PC`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    return NextResponse.json({
      project: projectResponse.data,
      issueTypes: issueTypesResponse.data,
      createMetadata: metadataResponse.data,
      cloudId,
      tokenPresent: !!token
    });

  } catch (error: any) {
    console.error('Debug API error:', error.response?.data);
    return NextResponse.json({
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }, { status: 500 });
  }
}