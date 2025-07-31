import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Clear all cookies
  const cookieStore = await cookies();
  
  // Delete all auth-related cookies
  const response = NextResponse.json({ message: 'Cookies cleared, please login again' });
  
  response.cookies.delete('jira_auth');
  response.cookies.delete('cloudId');
  response.cookies.delete('refresh_token');
  response.cookies.delete('user_data');
  
  return response;
}