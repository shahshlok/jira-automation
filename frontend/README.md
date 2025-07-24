# JIRA Test Management Dashboard - Frontend

A modern React frontend for automated test case monitoring and AI-powered testing insights for JIRA projects. This application provides a comprehensive dashboard interface for viewing test case status, coverage metrics, and getting AI assistance for test analysis.

## Features

### 🔐 Atlassian OAuth 2.0 Authentication
- Secure login with JIRA credentials
- Session management with HTTP-only cookies
- User profile display and logout functionality

### 📊 JIRA Integration Dashboard
- Project selection and navigation
- Hierarchical view: Projects → Epics → Stories → Test Cases
- Real-time data fetching with auto-refresh capabilities
- JIRA API proxy for secure backend communication

### 🧪 Test Case Management Interface
- Visual test case status tracking (Passing, Breaking, Partial Passing, Pending)
- Interactive pie charts showing test coverage distribution
- Detailed test case tables with timestamps and status indicators
- Story-level test analysis and reporting

### 🤖 AI-Powered Test Assistant
- Built-in chatbot panel for test analysis
- Contextual insights about test failures and coverage
- Suggestions for improving test suites
- Interactive Q&A about specific stories and test cases

### 🎨 Modern UI/UX Features
- Responsive design with sidebar navigation
- Tree view for project hierarchy
- Search functionality
- Animated components with smooth transitions
- Status pills and visual indicators

## Technologies

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Charts**: Recharts and React Minimal Pie Chart
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or bun
- Backend server running on port 5000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Full Setup (with Backend)

For complete functionality, you'll need the backend server running:

```bash
# From project root
cd ../backend && npm install && npm run dev
```

See the main project README for complete setup instructions including OAuth configuration.

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Main header with auth
│   ├── Sidebar/        # Navigation sidebar
│   ├── Story/          # Story-related components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── api/                # API utilities and mock data
└── lib/                # Utility functions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Mock Data

The application includes comprehensive mock data for development and testing:
- Mock projects, epics, stories, and test cases
- Realistic status distributions and timestamps
- AI chatbot response simulation

## Integration

This frontend is designed to work with the JIRA automation backend that provides:
- Atlassian OAuth 2.0 authentication
- JIRA API proxy endpoints
- Session management
- Real-time data synchronization

## Deployment

### Using Lovable (Recommended)

1. Visit the [Lovable Project](https://lovable.dev/projects/d32c6195-4580-4c4b-a1eb-201052547f24)
2. Click Share → Publish for instant deployment

### Manual Deployment

```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## Contributing

This project was built using Lovable's frontend stack. You can:

1. **Use Lovable**: Visit the project URL and start prompting for changes
2. **Use your IDE**: Clone, make changes, and push (syncs with Lovable)
3. **GitHub Integration**: Edit files directly or use Codespaces

## Custom Domain

To connect a custom domain:
1. Navigate to Project > Settings > Domains in Lovable
2. Click Connect Domain
3. Follow the [custom domain setup guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
