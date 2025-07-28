// Types for Jira data
export interface Project {
  id: string;
  name: string;
  key: string;
  avatarUrls?: {
    '16x16'?: string;
    '24x24'?: string;
    '32x32'?: string;
    '48x48'?: string;
  };
  projectTypeKey?: string;
  description?: string;
  insight?: {
    lastIssueUpdateTime: string;
    totalIssueCount: number;
  };
  projectCategory?: {
    id: string;
    name: string;
    description: string;
    self: string;
  };
  self?: string;
  simplified?: boolean;
  style?: string;
}

export interface Epic {
  key: string;
  summary: string;
}

export interface Story {
  key: string;
  summary: string;
  assignee?: {
    displayName: string;
    avatarUrl: string;
  };
  priority: {
    name: string;
    iconUrl: string;
  };
  updated: string;
  epicLink?: string;
}

export interface TestCase {
  key: string;
  summary: string;
  status: string;
}

// API helper functions
export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await fetch('/api/projects', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform backend response to match frontend Project interface
    return data.projects.map((project: any) => ({
      key: project.key,
      name: project.name,
      avatarUrls: project.avatarUrls,
      id: project.id,
      projectTypeKey: project.projectTypeKey,
      description: project.description,
      insight: project.insight,
      projectCategory: project.projectCategory,
      self: project.self,
      simplified: project.simplified,
      style: project.style
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
}

export async function fetchEpics(projectKey: string): Promise<Epic[]> {
  try {
    const response = await fetch(`/api/epics/${projectKey}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform Jira API response to match Epic interface
    return data.rawResponse.issues?.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary
    })) || [];
  } catch (error) {
    console.error('Failed to fetch epics:', error);
    throw error;
  }
}

export async function fetchStories(projectKey: string): Promise<Story[]> {
  try {
    const response = await fetch(`/api/stories/${projectKey}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter for stories only and transform Jira API response to match Story interface
    const transformedStories = data.rawResponse.issues
      ?.filter((issue: any) => issue.fields.issuetype.name === 'Story')
      ?.map((issue: any) => {
        const parentKey = issue.fields.parent?.key;
        
        return {
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
          epicLink: parentKey // Use parent.key as Epic Link
        };
      }) || [];
    
    return transformedStories;
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    throw error;
  }
}

export async function fetchTestCases(storyKey: string): Promise<TestCase[]> {
  try {
    const response = await fetch(`/api/testcases/${storyKey}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.testCases;
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    throw error;
  }
}

export async function checkAuth(): Promise<any> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Bulk data types for global search
export interface BulkData {
  projects: Project[];
  epics: Epic & { projectKey: string; projectName: string }[];
  stories: Story & { projectKey: string; projectName: string; status: string }[];
  tasks: {
    key: string;
    summary: string;
    issueType: string;
    assignee?: {
      displayName: string;
      avatarUrl: string;
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    updated: string;
    projectKey: string;
    projectName: string;
    status: string;
  }[];
  testCases: {
    key: string;
    summary: string;
    status: string;
    parentKey?: string;
    parentSummary?: string;
    projectKey: string;
    projectName: string;
  }[];
  metadata: {
    totalProjects: number;
    totalIssues: number;
    pagination: {
      startAt: number;
      maxResults: number;
      total: number;
      isLast: boolean;
    };
  };
}

export async function fetchBulkData(): Promise<BulkData> {
  try {
    const response = await fetch('/api/bulk-data', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch bulk data:', error);
    throw error;
  }
}