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
    
    safeLog({}, 'Fetching bulk data from Jira API v3...');
    
    // First, get all projects using project/search
    const projectsResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/search`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const projects = projectsResponse.data.values || [];
    
    // Load all data upfront for fast navigation - optimize for development/small-medium teams
    const startTime = Date.now();
    
    // Get all issues with pagination support
    let allIssues: any[] = [];
    let startAt = 0;
    const maxResults = 100; // Smaller batch size for better performance
    let hasMoreData = true;
    
    while (hasMoreData) {
      const issuesResponse = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          jql: '(issuetype in (Epic, Story, Task, Bug, Sub-task) OR parent is not EMPTY) ORDER BY project, issuetype, summary',
          fields: 'key,summary,issuetype,project,assignee,priority,updated,parent,status,customfield_10014', // Include Epic Link
          maxResults: maxResults,
          startAt: startAt
        }
      });
      
      const batchIssues = issuesResponse.data.issues || [];
      allIssues = allIssues.concat(batchIssues);
      
      // Check if there are more results
      hasMoreData = batchIssues.length === maxResults && 
                    startAt + maxResults < issuesResponse.data.total;
      startAt += maxResults;
      
      // Safety limit to prevent infinite loops
      if (allIssues.length >= 5000) {
        safeLog({ totalFetched: allIssues.length }, 'Reached safety limit for bulk data fetch');
        break;
      }
    }

    const loadTime = Date.now() - startTime;
    console.log(`📊 Bulk data loaded: ${allIssues.length} issues in ${loadTime}ms`);

    const issues = allIssues;
    
    // Group issues by type and project
    const epics = issues.filter((issue: any) => issue.fields.issuetype.name === 'Epic');
    const stories = issues.filter((issue: any) => issue.fields.issuetype.name === 'Story');
    const tasks = issues.filter((issue: any) => 
      ['Task', 'Bug'].includes(issue.fields.issuetype.name)
    );
    // Test cases are issues that have a parent (are subtasks) but are not standard issue types
    const testCases = issues.filter((issue: any) => 
      issue.fields.parent && 
      !['Epic', 'Story', 'Task', 'Bug'].includes(issue.fields.issuetype.name)
    );

    safeLog({
      projectCount: projects.length,
      epicCount: epics.length,
      storyCount: stories.length,
      taskCount: tasks.length,
      testCaseCount: testCases.length,
      totalIssues: issues.length
    }, 'Fetched bulk data from Jira API v3');
    
    return NextResponse.json({
      success: true,
      data: {
        projects,
        epics: epics.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          projectKey: issue.fields.project.key,
          projectName: issue.fields.project.name
        })),
        stories: stories.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          assignee: issue.fields.assignee ? {
            displayName: issue.fields.assignee.displayName,
            avatarUrl: issue.fields.assignee.avatarUrls?.['24x24'] || ''
          } : undefined,
          priority: {
            name: issue.fields.priority?.name || 'Medium',
            iconUrl: issue.fields.priority?.iconUrl || ''
          },
          updated: issue.fields.updated,
          // Check both parent and Epic Link field (customfield_10014 is common Epic Link field)
          epicLink: issue.fields.parent?.key || issue.fields.customfield_10014,
          projectKey: issue.fields.project.key,
          projectName: issue.fields.project.name,
          status: issue.fields.status?.name || 'Unknown'
        })),
        tasks: tasks.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          issueType: issue.fields.issuetype.name,
          assignee: issue.fields.assignee ? {
            displayName: issue.fields.assignee.displayName,
            avatarUrl: issue.fields.assignee.avatarUrls?.['24x24'] || ''
          } : undefined,
          priority: {
            name: issue.fields.priority?.name || 'Medium',
            iconUrl: issue.fields.priority?.iconUrl || ''
          },
          updated: issue.fields.updated,
          projectKey: issue.fields.project.key,
          projectName: issue.fields.project.name,
          status: issue.fields.status?.name || 'Unknown'
        })),
        testCases: testCases.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name || 'Unknown',
          parentKey: issue.fields.parent?.key,
          parentSummary: issue.fields.parent?.fields?.summary,
          projectKey: issue.fields.project.key,
          projectName: issue.fields.project.name
        })),
        metadata: {
          totalProjects: projects.length,
          totalIssues: issues.length,
          loadTime: loadTime,
          loadedAt: new Date().toISOString(),
          breakdown: {
            epics: epics.length,
            stories: stories.length,
            tasks: tasks.length,
            testCases: testCases.length
          },
          performance: {
            isNearLimit: issues.length > 800, // Alert at 80% of 1000 limit
            memoryEstimate: Math.round((JSON.stringify(issues).length / 1024 / 1024) * 100) / 100, // MB
            shouldConsiderPagination: issues.length >= 1000
          },
          pagination: {
            totalFetched: allIssues.length,
            batchSize: maxResults,
            reachedSafetyLimit: allIssues.length >= 5000,
            note: 'All available data fetched with pagination'
          }
        }
      }
    });

  } catch (error: any) {
    safeLog({ error: error.message, status: error.response?.status }, 'Bulk data fetch error');
    
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    } else if (error.response?.status === 403) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to fetch bulk data', 
        details: error.response?.data || error.message 
      }, { status: 500 });
    }
  }
}