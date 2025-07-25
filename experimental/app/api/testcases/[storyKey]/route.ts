import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { safeLog } from '@/lib/backend/jiraHelpers';
import { extractTestCasesFromStory } from '@/lib/backend/extractTestCasesFromStory';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyKey: string }> }
) {
  const { storyKey } = await params;
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
    
    const storyRes = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${storyKey}`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          fields: 'subtasks',
          expand: 'subtasks'
        }
      }
    );
    
    const testCases = extractTestCasesFromStory(storyRes.data);
    safeLog({}, `Extracted ${testCases.length} test cases for story ${storyKey}`);
    
    return NextResponse.json({ storyKey, testCases });
  } catch (error: any) {
    safeLog({ error: error.message, status: error.response?.status }, 'Test cases fetch error');
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    } else if (error.response?.status === 404) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to fetch test cases', 
        details: error.response?.data || error.message 
      }, { status: 500 });
    }
  }
}