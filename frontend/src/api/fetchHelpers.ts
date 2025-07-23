// API fetch helpers with mock data fallback

import { 
  mockProjects, 
  mockEpics, 
  mockStories, 
  mockTestCases,
  Project,
  Epic,
  Story,
  TestCase
} from './mockData';

// Global flag to switch between mock and real API
const USE_MOCK_DATA = false; // Set to false when backend is ready

export async function fetchJson<T>(url: string): Promise<T> {
  if (USE_MOCK_DATA) {
    // Mock endpoint routing
    if (url.includes('/rest/api/3/project/recent')) {
      return mockProjects as unknown as T;
    }
    
    if (url.includes('/rest/api/3/search') && url.includes('issuetype=Epic')) {
      const projectMatch = url.match(/project=([A-Z]+)/);
      const projectKey = projectMatch?.[1] || 'ECP';
      return { issues: mockEpics[projectKey] || [] } as unknown as T;
    }
    
    if (url.includes('/rest/api/3/search') && url.includes('issuetype=Story')) {
      const epicMatch = url.match(/"Epic Link"=([A-Z]+-\d+)/);
      const epicKey = epicMatch?.[1] || 'ECP-1';
      return { issues: mockStories[epicKey] || [] } as unknown as T;
    }
    
    if (url.includes('/stories/') && url.includes('/testcases')) {
      const storyMatch = url.match(/\/stories\/([A-Z]+-\d+)\/testcases/);
      const storyKey = storyMatch?.[1] || 'ECP-11';
      return { cases: mockTestCases[storyKey] || [] } as unknown as T;
    }
    
    throw new Error(`Mock endpoint not implemented: ${url}`);
  }
  
  // Real API implementation
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add auth headers here when backend is ready
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API fetch failed:', error);
    throw error;
  }
}

// Typed API functions
export async function fetchProjects(): Promise<Project[]> {
  if (USE_MOCK_DATA) {
    return await fetchJson<Project[]>('/rest/api/3/project/recent');
  }
  
  // Call backend API to get projects from Jira
  try {
    const response = await fetch('http://localhost:5000/api/projects', {
      credentials: 'include' // Include cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform backend response to match frontend Project interface
    return data.projects.map((project: any) => ({
      key: project.key,
      name: project.name,
      avatarUrl: project.avatarUrls?.['16x16'] || project.avatarUrls?.['24x24'] || '',
      id: project.id,
      projectTypeKey: project.projectTypeKey,
      description: project.description || ''
    }));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    throw error;
  }
}

export async function fetchEpics(projectKey: string): Promise<Epic[]> {
  if (USE_MOCK_DATA) {
    const response = await fetchJson<{ issues: Epic[] }>(`/rest/api/3/search?jql=project=${projectKey} AND issuetype=Epic`);
    return response.issues;
  }
  
  // Call backend API to get epics from Jira
  try {
    const response = await fetch(`http://localhost:5000/api/epics/${projectKey}`, {
      credentials: 'include' // Include cookies for authentication
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

export async function fetchStories(epicKey: string): Promise<Story[]> {
  const response = await fetchJson<{ issues: Story[] }>(`/rest/api/3/search?jql="Epic Link"=${epicKey} AND issuetype=Story`);
  return response.issues;
}

export async function fetchTestCases(storyKey: string): Promise<TestCase[]> {
  const response = await fetchJson<{ cases: TestCase[] }>(`/stories/${storyKey}/testcases`);
  return response.cases;
}