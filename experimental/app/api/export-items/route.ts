import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

interface ExportItem {
  title: string;
  description: string;
  steps?: string;
  expected_result?: string;
  acceptance_criteria?: string;
  priority?: string;
}

interface ExportRequest {
  type: 'test_case' | 'story';
  parentKey: string; // STORY-123 for test cases, EPIC-456 for user stories
  items: ExportItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { type, parentKey, items } = body;

    if (!type || !parentKey || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: type, parentKey, items' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('jira_auth')?.value;
    const cloudId = cookieStore.get('cloudId')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!cloudId) {
      return NextResponse.json({ error: 'No cloudId found' }, { status: 401 });
    }

    const results = [];
    
    for (const item of items) {
      try {
        // Build description text
        let descriptionText = item.description;
        
        if (type === 'test_case') {
          descriptionText += `\n\nRelated to: ${parentKey}`;
          if (item.steps) {
            descriptionText += `\n\nSteps:\n${item.steps}`;
          }
          if (item.expected_result) {
            descriptionText += `\n\nExpected Result:\n${item.expected_result}`;
          }
        } else if (type === 'story' && item.acceptance_criteria) {
          descriptionText += `\n\nAcceptance Criteria:\n${item.acceptance_criteria}`;
        }

        // Prepare Jira issue data with ADF format for description
        const issueData = {
          fields: {
            project: {
              key: parentKey.split('-')[0] // Extract project key from parent
            },
            summary: item.title,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: descriptionText
                    }
                  ]
                }
              ]
            },
            issuetype: {
              name: type === 'test_case' ? 'Sub-task' : 'Story'
            },
            ...(type === 'test_case' && {
              parent: {
                key: parentKey // For test cases, set parent as subtask
              }
            }),
            ...(type === 'story' && {
              customfield_10014: parentKey // Epic Link field for user stories
            })
          }
        };

        console.log('Creating Jira issue:', JSON.stringify(issueData, null, 2));
        console.log('Using cloudId:', cloudId);
        console.log('Token present:', !!token);

        // Test auth by reading parent issue first
        console.log(`Testing auth by reading issue ${parentKey}...`);
        try {
          await axios.get(
            `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${parentKey}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            }
          );
          console.log('✅ Auth test passed - can read parent issue');
        } catch (readError: any) {
          console.error('❌ Auth test failed:', readError.response?.status, readError.response?.data);
          throw new Error(`Auth failed: ${readError.response?.status} - ${readError.response?.data?.message || readError.message}`);
        }

        // Create the issue using Atlassian API
        const response = await axios.post(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`,
          issueData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 30000
          }
        );
        
        results.push({
          item: item.title,
          success: true,
          issueKey: response.data.key,
          message: 'Successfully exported to Jira'
        });

        console.log(`Successfully created issue: ${response.data.key}`);

      } catch (itemError: any) {
        const errorDetails = {
          message: itemError.message,
          status: itemError.response?.status,
          statusText: itemError.response?.statusText,
          data: itemError.response?.data,
          headers: itemError.response?.headers
        };
        
        console.error(`Failed to create issue for "${item.title}":`, errorDetails);
        
        results.push({
          item: item.title,
          success: false,
          error: itemError.response?.data?.errors || itemError.response?.data?.errorMessages || itemError.message,
          message: 'Failed to export to Jira',
          details: errorDetails
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`Export summary: ${successCount}/${totalCount} items successfully created`);

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });

  } catch (error: any) {
    console.error('Export API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to export items to Jira'
      },
      { status: 500 }
    );
  }
}