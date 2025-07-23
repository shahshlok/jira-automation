// Mock data for Jira Cloud API endpoints

export interface Project {
  id: string;
  name: string;
  key: string;
  avatarUrl: string;
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
}

export interface TestCase {
  id: string;
  description: string;
  status: 'Pending' | 'Breaking' | 'Partial Passing' | 'Passing';
  lastUpdated: string;
}

export const mockProjects: Project[] = [
  {
    id: "10001",
    name: "E-Commerce Platform",
    key: "ECP",
    avatarUrl: "/api/projects/ECP/avatar"
  },
  {
    id: "10002", 
    name: "Mobile App",
    key: "MOB",
    avatarUrl: "/api/projects/MOB/avatar"
  },
  {
    id: "10003",
    name: "Analytics Dashboard", 
    key: "ANA",
    avatarUrl: "/api/projects/ANA/avatar"
  }
];

export const mockEpics: Record<string, Epic[]> = {
  "ECP": [
    { key: "ECP-1", summary: "User Authentication & Authorization" },
    { key: "ECP-2", summary: "Shopping Cart & Checkout" },
    { key: "ECP-3", summary: "Product Catalog Management" },
    { key: "ECP-4", summary: "Payment Processing Integration" }
  ],
  "MOB": [
    { key: "MOB-1", summary: "Onboarding Flow" },
    { key: "MOB-2", summary: "Push Notifications" }
  ],
  "ANA": [
    { key: "ANA-1", summary: "Real-time Metrics" },
    { key: "ANA-2", summary: "Custom Dashboards" }
  ]
};

export const mockStories: Record<string, Story[]> = {
  "ECP-1": [
    {
      key: "ECP-11",
      summary: "User Registration with Email Verification",
      assignee: { displayName: "Sarah Johnson", avatarUrl: "/avatars/sarah.jpg" },
      priority: { name: "High", iconUrl: "/priority/high.svg" },
      updated: "2024-01-15T10:30:00Z"
    },
    {
      key: "ECP-12", 
      summary: "Social Login Integration (Google, Facebook)",
      assignee: { displayName: "Mike Chen", avatarUrl: "/avatars/mike.jpg" },
      priority: { name: "Medium", iconUrl: "/priority/medium.svg" },
      updated: "2024-01-14T14:20:00Z"
    },
    {
      key: "ECP-13",
      summary: "Password Reset Flow",
      priority: { name: "Low", iconUrl: "/priority/low.svg" },
      updated: "2024-01-13T09:15:00Z"
    }
  ],
  "ECP-2": [
    {
      key: "ECP-21",
      summary: "Add Items to Shopping Cart",
      assignee: { displayName: "Lisa Park", avatarUrl: "/avatars/lisa.jpg" },
      priority: { name: "High", iconUrl: "/priority/high.svg" },
      updated: "2024-01-16T11:45:00Z"
    },
    {
      key: "ECP-22",
      summary: "Checkout Process with Guest Option",
      assignee: { displayName: "David Wilson", avatarUrl: "/avatars/david.jpg" },
      priority: { name: "Critical", iconUrl: "/priority/critical.svg" },
      updated: "2024-01-16T16:30:00Z"
    }
  ]
};

export const mockTestCases: Record<string, TestCase[]> = {
  "ECP-11": [
    {
      id: "TC-001",
      description: "Valid email registration creates new user account",
      status: "Passing",
      lastUpdated: "2024-01-15T10:30:00Z"
    },
    {
      id: "TC-002", 
      description: "Invalid email format shows validation error",
      status: "Passing",
      lastUpdated: "2024-01-15T10:25:00Z"
    },
    {
      id: "TC-003",
      description: "Email verification link expires after 24 hours",
      status: "Partial Passing",
      lastUpdated: "2024-01-15T09:45:00Z"
    },
    {
      id: "TC-004",
      description: "Duplicate email registration shows error message",
      status: "Breaking",
      lastUpdated: "2024-01-14T16:20:00Z"
    },
    {
      id: "TC-005",
      description: "Password strength requirements are enforced",
      status: "Pending",
      lastUpdated: "2024-01-13T14:10:00Z"
    }
  ],
  "ECP-12": [
    {
      id: "TC-006",
      description: "Google OAuth login redirects correctly",
      status: "Passing",
      lastUpdated: "2024-01-14T14:20:00Z"
    },
    {
      id: "TC-007",
      description: "Facebook login handles account linking",
      status: "Breaking",
      lastUpdated: "2024-01-14T13:30:00Z"
    },
    {
      id: "TC-008",
      description: "Social login creates user profile automatically",
      status: "Partial Passing", 
      lastUpdated: "2024-01-14T12:15:00Z"
    }
  ],
  "ECP-21": [
    {
      id: "TC-009",
      description: "Add single item to empty cart",
      status: "Passing",
      lastUpdated: "2024-01-16T11:45:00Z"
    },
    {
      id: "TC-010",
      description: "Update item quantity in cart",
      status: "Passing",
      lastUpdated: "2024-01-16T11:30:00Z"
    },
    {
      id: "TC-011",
      description: "Remove item from cart",
      status: "Pending",
      lastUpdated: "2024-01-16T10:20:00Z"
    },
    {
      id: "TC-012",
      description: "Cart persists across browser sessions",
      status: "Breaking",
      lastUpdated: "2024-01-15T17:45:00Z"
    }
  ]
};

export const mockChatMessages = [
  {
    id: "1",
    type: "assistant" as const,
    content: "Hi! I'm your test assistant. I can help you understand test coverage, explain failing tests, or suggest improvements for the selected story.",
    timestamp: new Date("2024-01-16T10:00:00Z")
  },
  {
    id: "2", 
    type: "user" as const,
    content: "What's the status of the test cases for this story?",
    timestamp: new Date("2024-01-16T10:01:00Z")
  },
  {
    id: "3",
    type: "assistant" as const,
    content: "Based on the current test results for ECP-11 (User Registration with Email Verification), you have:\n\n• 2 Passing tests (40%)\n• 1 Partial Passing test (20%)\n• 1 Breaking test (20%)\n• 1 Pending test (20%)\n\nThe breaking test 'Duplicate email registration shows error message' needs attention. Would you like me to analyze the failure pattern?",
    timestamp: new Date("2024-01-16T10:02:00Z")
  }
];