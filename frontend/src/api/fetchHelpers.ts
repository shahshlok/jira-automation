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
const USE_MOCK_DATA = true; // Set to false when backend is ready

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
  return await fetchJson<Project[]>('/rest/api/3/project/recent');
}

export async function fetchEpics(projectKey: string): Promise<Epic[]> {
  const response = await fetchJson<{ issues: Epic[] }>(`/rest/api/3/search?jql=project=${projectKey} AND issuetype=Epic`);
  return response.issues;
}

export async function fetchStories(epicKey: string): Promise<Story[]> {
  const response = await fetchJson<{ issues: Story[] }>(`/rest/api/3/search?jql="Epic Link"=${epicKey} AND issuetype=Story`);
  return response.issues;
}

export async function fetchTestCases(storyKey: string): Promise<TestCase[]> {
  const response = await fetchJson<{ cases: TestCase[] }>(`/stories/${storyKey}/testcases`);
  return response.cases;
}