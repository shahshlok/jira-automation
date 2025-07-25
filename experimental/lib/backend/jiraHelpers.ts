import axios from 'axios';

// Shared function to fetch accessible resources from Atlassian API
export async function fetchAccessibleResources(token: string) {
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

// Security helper to redact sensitive information from logs
export function safeLog(obj: any, message?: string) {
  if (typeof obj === 'object' && obj !== null) {
    const safe = { ...obj };
    // Remove sensitive fields
    if (safe.headers) {
      const safeHeaders = { ...safe.headers };
      delete safeHeaders.Authorization;
      delete safeHeaders.authorization;
      safe.headers = safeHeaders;
    }
    if (safe.Authorization) delete safe.Authorization;
    if (safe.authorization) delete safe.authorization;
    
    console.log(message || 'Debug:', safe);
  } else {
    console.log(message || 'Debug:', obj);
  }
}