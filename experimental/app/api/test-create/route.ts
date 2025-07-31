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
    // First, let's decode the token to see what scopes it actually has
    const tokenParts = token.split('.');
    let tokenPayload = null;
    try {
      tokenPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    } catch (e) {
      console.log('Could not decode token');
    }

    // Test 1: Get available issue types for the project
    const projectKey = 'PC';
    const metadataResponse = await axios.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/createmeta?projectKeys=${projectKey}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    const project = metadataResponse.data.projects[0];
    const availableIssueTypes = project?.issuetypes?.map((type: any) => ({
      name: type.name,
      id: type.id,
      required: type.fields ? Object.keys(type.fields).filter(key => type.fields[key].required) : []
    })) || [];

    // Test 2: Try creating a simple task with ADF format
    const simpleIssue = {
      fields: {
        project: { key: projectKey },
        summary: "Test Issue - Please Delete",
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This is a test issue created by the export functionality. Please delete."
                }
              ]
            }
          ]
        },
        issuetype: { name: "Task" }
      }
    };

    console.log('Attempting to create test issue:', JSON.stringify(simpleIssue, null, 2));

    try {
      const createResponse = await axios.post(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`,
        simpleIssue,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // If successful, immediately delete the test issue
      try {
        await axios.delete(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${createResponse.data.key}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
      } catch (deleteError) {
        console.log('Could not delete test issue, please delete manually:', createResponse.data.key);
      }

      return NextResponse.json({
        success: true,
        canCreateIssues: true,
        testIssueCreated: createResponse.data.key,
        availableIssueTypes: availableIssueTypes,
        tokenScopes: tokenPayload?.scope || 'Could not decode'
      });

    } catch (createError: any) {
      console.error('Create issue error:', createError.response?.data);
      return NextResponse.json({
        success: false,
        canCreateIssues: false,
        createError: createError.response?.data || createError.message,
        createStatus: createError.response?.status,  
        availableIssueTypes: availableIssueTypes,
        tokenScopes: tokenPayload?.scope || 'Could not decode',
        fullError: {
          message: createError.message,
          status: createError.response?.status,
          statusText: createError.response?.statusText,
          data: createError.response?.data
        }
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    }, { status: 500 });
  }
}