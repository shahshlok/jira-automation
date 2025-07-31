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

  console.log('Auth test - token present:', !!token);
  console.log('Auth test - cloudId present:', !!cloudId);

  try {
    // Simple test - just get user info
    const userTest = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    return NextResponse.json({
      success: true,
      user: userTest.data.displayName,
      tokenWorks: true,
      cloudId: cloudId
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }, { status: 500 });
  }
}