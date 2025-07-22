import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const CLIENT_ID = process.env.CLIENT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/auth/atlassian', (req, res) => {
  const authUrl =
   `https://auth.atlassian.com/authorize?audience=api.atlassian.com` +
   `&client_id=${CLIENT_ID}` +
   `&scope=read%3Ame` +
   `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
   // Using the Authorization Code workflow (provide a code upon successful login)
   `&response_type=code` +
   // Forces the consent screen, ensuring the user is aware of the permissions being requested
   `&prompt=consent`;

  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

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
    
    // This call fetches the user's basic profile information
    const userResponse = await axios.get('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    const userInfo = userResponse.data;
    
    res.cookie('jira_auth', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/auth/me', async (req, res) => {
  const token = req.cookies.jira_auth;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userResponse = await axios.get('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    res.json(userResponse.data);
  } catch (error) {
    console.error('User info fetch error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('jira_auth');
  res.json({ message: 'Logged out successfully' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});