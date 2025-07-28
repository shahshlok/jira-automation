# DX Test Hub - Project Structure

This document provides a comprehensive overview of the project structure for new team members joining the DX Test Hub dashboard project.

## 📋 Project Overview

DX Test Hub is a Next.js-based dashboard application for managing and visualizing Jira projects, epics, stories, and their associated test cases. The application provides a hierarchical view with test status tracking and AI-powered features.

## 🏗️ Directory Structure

```
experimental/
├── 📁 app/                          # Next.js App Router
│   ├── 📄 page.tsx                  # Main dashboard (entry point)
│   ├── 📄 layout.tsx                # Root layout & providers
│   ├── 📄 loading.tsx               # Global loading component
│   ├── 📄 middleware.ts             # Auth & route protection
│   ├── 📁 login/
│   │   └── 📄 page.tsx              # Authentication page
│   └── 📁 api/                      # RESTful API endpoints
│       ├── 📁 auth/                 # OAuth flow
│       │   ├── 📄 atlassian/route.ts
│       │   ├── 📄 callback/route.ts
│       │   ├── 📄 logout/route.ts
│       │   └── 📄 me/route.ts
│       ├── 📄 projects/route.ts
│       ├── 📁 epics/[projectKey]/
│       ├── 📁 stories/[projectKey]/
│       └── 📁 testcases/[storyKey]/
│
├── 📁 components/                   # Reusable UI Components
│   ├── 📁 dashboard/                # Business logic components
│   │   ├── 📁 layout/               # Application structure
│   │   │   ├── 📄 HeaderBar.tsx     # Top navigation bar
│   │   │   ├── 📄 ProjectsSidebar.tsx # Left project panel
│   │   │   └── 📄 StoryDetailsSidebar.tsx # Right details panel
│   │   ├── 📁 views/                # Data presentation layers
│   │   │   ├── 📄 EpicGridView.tsx  # Epic grid display
│   │   │   └── 📄 StoryGridView.tsx # Story grid display  
│   │   ├── 📄 AIGenerationDialog.tsx # AI test generation
│   │   ├── 📄 GlobalSearchDialog.tsx # Global search (⌘K)
│   │   ├── 📄 StackedProgressBar.tsx # Test progress viz
│   │   └── 📄 StatusDistributionPieChart.tsx
│   └── 📁 ui/                       # Design system primitives
│       ├── 📄 avatar.tsx, badge.tsx, button.tsx
│       ├── 📄 card.tsx, dialog.tsx, dropdown-menu.tsx
│       └── 📄 input.tsx, progress.tsx, tabs.tsx
│
├── 📁 lib/                          # Utilities & Business Logic
│   ├── 📄 apiHelpers.ts             # API functions & types
│   ├── 📄 projectStorage.ts         # localStorage utilities
│   ├── 📄 utils.ts                  # General utilities
│   ├── 📁 backend/                  # Server-side logic
│   │   ├── 📄 jiraHelpers.ts        # Jira API integration
│   │   └── 📄 extractTestCasesFromStory.ts # AI logic
│   └── 📁 dashboard/                # Dashboard-specific logic
│       ├── 📄 types.ts              # TypeScript types
│       └── 📄 testHelpers.tsx       # Data aggregation utils
│
├── 📁 public/                       # Static assets
│   └── 📄 *.svg                     # Icons & images
│
└── 📄 Config Files                  # Project configuration
    ├── package.json, tsconfig.json
    ├── next.config.ts, tailwind.config.js
    └── components.json (shadcn/ui)
```

### `/app` - Next.js App Router
The main application routing and API endpoints using Next.js 13+ App Router pattern.

#### **Core Pages**
- `page.tsx` - Main dashboard component (entry point)
- `layout.tsx` - Root layout with global providers
- `loading.tsx` - Global loading component
- `login/page.tsx` - Authentication page

#### **API Routes** (`/app/api`)
RESTful API endpoints for backend functionality:

- `auth/` - Authentication flow
  - `atlassian/route.ts` - OAuth initiation with Atlassian
  - `callback/route.ts` - OAuth callback handler
  - `logout/route.ts` - Session termination
  - `me/route.ts` - Current user information

- `projects/route.ts` - Fetch all accessible projects
- `epics/[projectKey]/route.ts` - Fetch epics for a project
- `stories/[projectKey]/route.ts` - Fetch stories for a project
- `testcases/[storyKey]/route.ts` - Fetch test cases for a story

### `/components` - Reusable UI Components

#### **Dashboard Components** (`/components/dashboard`)
Application-specific business logic components:

##### **Layout Components** (`layout/`)
- `HeaderBar.tsx` - Top navigation with search, user menu, and project info
- `ProjectsSidebar.tsx` - Left sidebar showing projects with progress metrics
- `StoryDetailsSidebar.tsx` - Right sidebar for detailed story information

##### **View Components** (`views/`)
- `EpicGridView.tsx` - Grid display of epics with test progress visualization
- `StoryGridView.tsx` - Grid display of stories within an epic

##### **Feature Components**
- `AIGenerationDialog.tsx` - Modal for AI-powered test generation
- `GlobalSearchDialog.tsx` - Global search functionality (⌘K)
- `StackedProgressBar.tsx` - Custom progress visualization for test statuses
- `StatusDistributionPieChart.tsx` - Pie chart for test status distribution

#### **UI Components** (`/components/ui`)
Reusable, design-system components (shadcn/ui based):
- `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`
- `dropdown-menu.tsx`, `input.tsx`, `progress.tsx`, `tabs.tsx`

### `/lib` - Utility Libraries and Helpers

#### **API Layer**
- `apiHelpers.ts` - Main API functions and TypeScript interfaces
  - Functions: `fetchProjects()`, `fetchEpics()`, `fetchStories()`, `fetchTestCases()`
  - Types: `Project`, `Epic`, `Story`, `TestCase`

#### **Backend Logic** (`/lib/backend`)
- `jiraHelpers.ts` - Jira API integration utilities
- `extractTestCasesFromStory.ts` - AI logic for test case extraction

#### **Dashboard Logic** (`/lib/dashboard`)
- `types.ts` - Dashboard-specific TypeScript types (`EpicWithStories`)
- `testHelpers.tsx` - Test data aggregation and calculation utilities

#### **Storage & Utilities**
- `projectStorage.ts` - Browser localStorage for project persistence
- `utils.ts` - General utility functions (likely includes cn() for styling)

### `/middleware.ts`
Next.js middleware for authentication and route protection.

## 🔄 Application Flow

### 1. **Authentication Flow**
1. User visits app → redirected to `/login` if not authenticated
2. Login page initiates OAuth with Atlassian via `/api/auth/atlassian`
3. After OAuth success, user is redirected back via `/api/auth/callback`
4. Dashboard loads with user session

### 2. **Data Loading Hierarchy**
```
Projects (loaded on app start)
    ↓
Epics + Stories (loaded when project selected)
    ↓
Test Cases (loaded for each story in parallel)
```

### 3. **Navigation Flow**
```
Dashboard → Project Selection → Epic Grid View → Story Grid View
                                      ↓
                              Story Details Sidebar
```

## 🎯 Key Design Patterns

### **State Management**
- React hooks for local component state
- Project selection persisted to localStorage
- No global state management library (Redux/Zustand) currently used

### **Data Fetching**
- Server-side API routes proxy Jira API calls
- Client-side fetching with error handling
- Progressive data loading (projects → epics/stories → test cases)

### **UI Architecture**
- **Layout Components**: Handle application structure and navigation
- **View Components**: Handle data presentation for different hierarchy levels
- **Feature Components**: Handle specific interactions (search, AI generation)
- **UI Components**: Provide consistent design system primitives

### **Responsive Design**
- Desktop-first approach with collapsible sidebars
- Grid layouts that adapt to content
- Mobile considerations for key interactions

## 🚀 Getting Started for New Developers

### **Essential Files to Understand First:**
1. `app/page.tsx` - Main application logic and state management
2. `lib/apiHelpers.ts` - Data layer and API contracts
3. `components/dashboard/layout/` - Application structure
4. `lib/dashboard/types.ts` - Data models

### **Common Development Tasks:**
- **Adding new API endpoint**: Create in `/app/api/` following existing patterns
- **New UI component**: Add to `/components/ui/` using shadcn/ui conventions
- **Dashboard feature**: Add to `/components/dashboard/` with appropriate subfolder
- **Data transformation**: Extend functions in `/lib/dashboard/testHelpers.tsx`

### **Key Dependencies:**
- **Next.js 13+** - App Router, API routes
- **React 18** - Hooks, server components where applicable
- **shadcn/ui** - Design system components
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

This structure ensures clear separation of concerns, making it easy to locate functionality and maintain code organization as the project scales.