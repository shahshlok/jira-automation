import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import axios from 'axios';
import dotenv from 'dotenv';
import { extractTestCasesFromStory } from './src/extractTestCasesFromStory.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const CLIENT_ID = process.env.CLIENT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JIRA_SITE_URL = process.env.JIRA_SITE_URL;

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Shared function to fetch accessible resources from Atlassian API
async function fetchAccessibleResources(token) {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  const response = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  return response.data;
}

// Helper function to get cloudId from session with fallback
async function getCloudId(req) {
  // First, try to get from session (cached)
  if (req.session.cloudId) {
    console.log('Using cached cloudId');
    return {
      cloudId: req.session.cloudId,
      siteName: req.session.siteName,
      siteUrl: req.session.siteUrl,
      fromCache: true
    };
  }

  // Fallback: fetch from API if not in session
  console.log('CloudId not in session, fetching from API...');
  const token = req.cookies.jira_auth;
  
  const resourcesData = await fetchAccessibleResources(token);
  const primarySite = resourcesData[0];
  
  // Cache it in session for future use
  req.session.cloudId = primarySite.id;
  req.session.siteName = primarySite.name;
  req.session.siteUrl = primarySite.url;
  
  console.log('CloudId fetched and cached.');
  
  return {
    cloudId: primarySite.id,
    siteName: primarySite.name,
    siteUrl: primarySite.url,
    fromCache: false
  };
}

app.get('/auth/atlassian', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in session for validation
  req.session.oauthState = state;
  
  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=ANJmu8fRQoUaa6RsjM1jGX9QXVssr1s9&scope=read%3Ajira-work%20read%3Ajira-user%20manage%3Ajira-configuration&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fauth%2Fcallback&state=${state}&response_type=code&prompt=consent`;

  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }
  
  // Validate state parameter for CSRF protection
  if (!state || state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid state parameter - possible CSRF attack' });
  }
  
  // Clear the state from session after validation
  delete req.session.oauthState;

  try {
      
    // Send a request to the Atlassian token endpoint to get the actual access_token instead of the code that was sent previously when the user successfully logged in on Atlassian.
    // Returns the access_token in a JSON object
    const tokenResponse = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: SECRET_KEY,
      code: code, 
      redirect_uri: REDIRECT_URI 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // This token allows you to access Atlassian's APIs on behalf of the user
    const { access_token } = tokenResponse.data;
    
    // Fetch and cache cloudId in session immediately after authentication
    console.log('Fetching accessible resources to cache cloudId...');
    const resourcesData = await fetchAccessibleResources(access_token);

    // Store cloudId and site info in session for future API calls
    const primarySite = resourcesData[0];
    req.session.cloudId = primarySite.id;
    req.session.siteName = primarySite.name;
    req.session.siteUrl = primarySite.url;
    
    console.log('CloudId cached in session:', primarySite.id);
    
    res.cookie('jira_auth', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error - Full error:', error);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
    console.error('Request config:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data
    });
    res.status(500).json({ error: 'Authentication failed', details: error.response?.data || error.message });
  }
});

app.get('/api/accessible-resources', async (req, res) => {
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    console.log("inside accessible resources api to get cloudId")
    const resourcesData = await fetchAccessibleResources(token);
    
    // Return the accessible resources data
    res.json({
      success: true,
      resources: resourcesData,
      totalSites: resourcesData.length,
      primarySite: resourcesData[0] // Since user has one site
    });
  } catch (error) {
    console.error('Accessible resources error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else {
      res.status(500).json({ error: 'Failed to get accessible resources', details: error.response?.data || error.message });
    }
  }
});

app.get('/auth/me', async (req, res) => {
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Since we don't have read:me scope, we'll get user info from Jira instead
    const siteInfo = await getCloudId(req);
    const userResponse = await axios.get(`https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/myself`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Format the response to match what the frontend expects
    const userData = userResponse.data;
    res.json({
      name: userData.displayName || userData.name,
      email: userData.emailAddress,
      account_id: userData.accountId,
      picture: userData.avatarUrls?.['48x48'] || userData.avatarUrls?.['32x32']
    });
  } catch (error) {
    console.error('User info fetch error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.post('/auth/logout', (req, res) => {
  // Clear authentication cookie
  res.clearCookie('jira_auth');
  
  // Clear cached cloudId and site info from session
  if (req.session) {
    delete req.session.cloudId;
    delete req.session.siteName;
    delete req.session.siteUrl;
    console.log('Cleared cloudId cache from session on logout');
  }
  
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/projects', async (req, res) => {
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get cloudId from session cache (much faster!)
    const siteInfo = await getCloudId(req);
    
    // Fetch projects using the cached cloudId
    console.log('Fetching projects from Jira API v3...');
    const projectsResponse = await axios.get(`https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/project`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    console.log("Fetched projects from Jira API v3")
    // Return the projects with metadata
    res.json({
      success: true,
      cloudId: siteInfo.cloudId,
      siteName: siteInfo.siteName,
      siteUrl: siteInfo.siteUrl,
      fromCache: siteInfo.fromCache,
      totalProjects: projectsResponse.data.length,
      projects: projectsResponse.data
    });

  } catch (error) {
    console.error('Projects fetch error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'Insufficient permissions to access projects' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch projects', 
        details: error.response?.data || error.message 
      });
    }
  }
});

app.get('/api/epics/:projectKey', async (req, res) => {
  const token = req.cookies.jira_auth;
  const { projectKey } = req.params;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!projectKey) {
    return res.status(400).json({ error: 'Project key is required' });
  }

  try {
    // Get cloudId from session cache
    const siteInfo = await getCloudId(req);
    
    // Fetch epics using JQL search
    console.log(`Fetching epics for project ${projectKey} from Jira API v3...`);
    const epicsResponse = await axios.get(`https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/search`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        jql: `project=${projectKey} AND issuetype=Epic`
      }
    });
    
    console.log(`Fetched ${epicsResponse.data.issues.length} epics for project ${projectKey}`);
    
    // Return the epics with metadata
    res.json({
      success: true,
      projectKey: projectKey,
      totalEpics: epicsResponse.data.issues.length,
      rawResponse: epicsResponse.data
    });

  } catch (error) {
    console.error('Epics fetch error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'Insufficient permissions to access epics' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch epics', 
        details: error.response?.data || error.message 
      });
    }
  }
});

app.get('/api/stories/:projectKey', async (req, res) => {
  const token = req.cookies.jira_auth;
  const { projectKey } = req.params;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!projectKey) {
    return res.status(400).json({ error: 'Project key is required' });
  }

  try {
    // Get cloudId from session cache
    const siteInfo = await getCloudId(req);
    
    // Fetch stories using JQL search
    console.log(`Fetching stories for project ${projectKey} from Jira API v3...`);
    const storiesResponse = await axios.get(`https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/search`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        jql: `project=${projectKey} AND issuetype=Story AND parent IS NOT EMPTY`
      }
    });
    
    console.log(`Fetched ${storiesResponse.data.issues.length} stories for project ${projectKey}`);
    
    // Return the stories with metadata
    res.json({
      success: true,
      projectKey: projectKey,
      totalStories: storiesResponse.data.issues.length,
      rawResponse: storiesResponse.data
    });

  } catch (error) {
    console.error('Stories fetch error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'Insufficient permissions to access stories' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch stories', 
        details: error.response?.data || error.message 
      });
    }
  }
});

app.get('/api/testcases/:storyKey', async (req, res) => {
  const { storyKey } = req.params;
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const siteInfo = await getCloudId(req);
    const storyRes = await axios.get(
      `https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/issue/${storyKey}`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          fields: 'subtasks',
          expand: 'subtasks'
        }
      }
    );
    
    const testCases = extractTestCasesFromStory(storyRes.data);
    console.log(`Extracted ${testCases.length} test cases for story ${storyKey}.`);
    
    res.json({ storyKey, testCases });
  } catch (error) {
    console.error('Test cases fetch error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid or expired token' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Story not found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch test cases', 
        details: error.response?.data || error.message 
      });
    }
  }
});

// API Tester endpoint - proxies requests to Jira API
app.all('/api/jira-proxy/*', async (req, res) => {
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const siteInfo = await getCloudId(req);
    const apiPath = req.params[0]; // Everything after /api/jira-proxy/
    
    // Construct the full Jira API URL
    const jiraUrl = `https://api.atlassian.com/ex/jira/${siteInfo.cloudId}/rest/api/3/${apiPath}`;
    
    const config = {
      method: req.method,
      url: jiraUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    // Add request body for POST/PUT requests
    if (req.body && Object.keys(req.body).length > 0) {
      config.data = req.body;
    }

    // Add query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    console.log(`API Tester: ${req.method} ${jiraUrl}`);
    const response = await axios(config);
    
    // Return raw Jira API response without formatting
    res.json(response.data);

  } catch (error) {
    console.error('API Tester error:', error.response?.data || error.message);
    // Return raw error response from Jira API without formatting
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});