import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear authentication cookies
  cookieStore.delete('jira_auth');
  cookieStore.delete('cloudId');
  cookieStore.delete('siteName');
  
  console.log('Cleared authentication cookies on logout');
  
  return NextResponse.json({ message: 'Logged out successfully' });
}