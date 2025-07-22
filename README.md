# JIRA Automation with Atlassian OAuth

A full-stack application that implements Atlassian OAuth 2.0 authentication and JIRA API integration for automation workflows. The application consists of an Express.js backend with JIRA REST API proxy capabilities and a React frontend.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm
- Atlassian OAuth app credentials

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd jira-automation

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

The backend `.env` file is already configured with your OAuth credentials:

```
CLIENT_ID=<insert client id>
SECRET_KEY=<insert secret key>
REDIRECT_URI=http://localhost:5000/auth/callback
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:3000`.

### 4. Test the Authentication Flow

1. Open `http://localhost:3000` in your browser
2. Click "Login with Atlassian"
3. Complete the Atlassian OAuth flow
4. You'll be redirected to `/dashboard` with your user information

## 📁 Project Structure

```
jira-automation/
├── backend/
│   ├── server.js          # Express server with OAuth routes
│   ├── package.json       # Backend dependencies
│   └── .env              # OAuth credentials
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── Login.jsx     # Login page
│   │   ├── Dashboard.jsx # Protected dashboard
│   │   ├── index.js      # React entry point
│   │   ├── App.css       # Styles
│   │   └── index.css     # Global styles
│   ├── public/
│   │   ├── index.html    # HTML template
│   │   └── manifest.json # PWA manifest
│   └── package.json      # Frontend dependencies
└── README.md             # This file
```

## 🔧 API Endpoints

### Backend Routes

#### Authentication
- `GET /auth/atlassian` - Redirects to Atlassian OAuth login
- `GET /auth/callback` - Handles OAuth callback and sets cookies
- `GET /auth/me` - Returns authenticated user info (protected)
- `POST /auth/logout` - Clears authentication cookies

#### JIRA API Integration
- `GET /api/accessible-resources` - Returns Atlassian resources accessible to the user
- `GET /api/projects` - Returns JIRA projects for the authenticated user
- `ALL /api/jira-proxy/*` - Proxy for JIRA REST API calls (supports GET, POST, PUT, DELETE)

#### System
- `GET /health` - Health check endpoint

## 🧪 API Testing

The application includes a built-in JIRA API tester that allows you to test any JIRA REST API endpoint directly through the proxy:

**Base URL**: `http://localhost:5000/api/jira-proxy/`

**Usage**: Append any JIRA API v3 path to the base URL. For example:
- `GET /api/jira-proxy/project` - List all projects
- `GET /api/jira-proxy/issue/PROJ-123` - Get specific issue
- `POST /api/jira-proxy/issue` - Create new issue
- `PUT /api/jira-proxy/issue/PROJ-123` - Update issue

The proxy automatically handles authentication and forwards your request to the appropriate JIRA API endpoint.

## 🔐 Security Features

- **HTTP-only cookies**: Access tokens are stored in secure, HTTP-only cookies
- **CORS configured**: Only allows requests from the frontend origin
- **Token validation**: All protected routes validate the access token
- **Secure redirects**: Proper validation of redirect URIs

## 🛠 Development

### Backend Development

```bash
cd backend
npm run dev  # Uses --watch flag for auto-restart
```

### Frontend Development

```bash
cd frontend
npm start    # Hot reload enabled
```

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `CLIENT_ID` | Atlassian OAuth Client ID | Required |
| `SECRET_KEY` | Atlassian OAuth Secret | Required |
| `REDIRECT_URI` | OAuth callback URL | `http://localhost:5000/auth/callback` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `JIRA_SITE_URL` | Your JIRA site URL | Optional |
| `SESSION_SECRET` | Express session secret | Auto-generated |
| `PORT` | Server port | `5000` |

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production`
2. Update `REDIRECT_URI` to production URL
3. Update `FRONTEND_URL` to production URL
4. Ensure HTTPS is enabled for secure cookies

### Frontend

1. Update API URLs to production backend
2. Build the React app: `npm run build`
3. Serve the built files

## 📋 OAuth Setup

To set up your own Atlassian OAuth app:

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Create a new OAuth 2.0 (3LO) app
3. Set the callback URL to: `http://localhost:5000/auth/callback`
4. Add the following scopes:
   - `read:jira-work` - Read JIRA work data (issues, projects, etc.)
   - `read:jira-user` - Read JIRA user information
   - `manage:jira-configuration` - Manage JIRA configuration
5. Copy your Client ID and Secret to the `.env` file

## 🔍 Troubleshooting

### Common Issues

1. **OAuth callback fails**: Check that your `REDIRECT_URI` matches exactly what's configured in Atlassian
2. **CORS errors**: Ensure the backend `FRONTEND_URL` matches your React app URL
3. **401 errors**: Check that cookies are being sent with requests (`credentials: 'include'`)
4. **Token expired**: The app handles token expiration by redirecting to login

### Logs

Backend logs include:
- OAuth callback errors
- User info fetch errors
- Server startup information

## 📄 License

MIT License