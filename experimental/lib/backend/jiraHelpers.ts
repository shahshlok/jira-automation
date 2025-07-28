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

// Production-grade logging function with security redaction
export function safeLog(obj: any, message?: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
  // Skip debug logs in production
  if (level === 'debug' && process.env.NODE_ENV === 'production') {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = message || 'Log';

  if (typeof obj === 'object' && obj !== null) {
    const safe = sanitizeLogData(obj);
    
    // Use appropriate console method based on level
    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR: ${logMessage}`, safe);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${logMessage}`, safe);
        break;
      case 'debug':
        console.debug(`[${timestamp}] DEBUG: ${logMessage}`, safe);
        break;
      default:
        console.log(`[${timestamp}] INFO: ${logMessage}`, safe);
    }
  } else {
    // Handle primitive values and errors
    const logData = obj instanceof Error ? { 
      message: obj.message, 
      stack: process.env.NODE_ENV === 'development' ? obj.stack : undefined 
    } : obj;

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR: ${logMessage}`, logData);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${logMessage}`, logData);
        break;
      case 'debug':
        console.debug(`[${timestamp}] DEBUG: ${logMessage}`, logData);
        break;
      default:
        console.log(`[${timestamp}] INFO: ${logMessage}`, logData);
    }
  }
}

// Helper function to recursively sanitize sensitive data
function sanitizeLogData(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeLogData(item));
  }

  const safe = { ...obj };
  
  // Common sensitive field patterns
  const sensitiveFields = [
    'password', 'passwd', 'pwd',
    'token', 'accessToken', 'refreshToken', 'apiKey', 'api_key',
    'authorization', 'Authorization', 'auth',
    'secret', 'clientSecret', 'client_secret',
    'key', 'privateKey', 'private_key',
    'sessionId', 'session_id', 'sid',
    'creditCard', 'credit_card', 'ccNumber', 'cc_number',
    'ssn', 'social_security_number'
  ];

  // Remove or redact sensitive fields
  for (const field of sensitiveFields) {
    if (field in safe) {
      safe[field] = '[REDACTED]';
    }
  }

  // Handle nested headers object
  if (safe.headers && typeof safe.headers === 'object') {
    safe.headers = sanitizeLogData(safe.headers);
  }

  // Recursively sanitize nested objects
  for (const key in safe) {
    if (safe[key] && typeof safe[key] === 'object') {
      safe[key] = sanitizeLogData(safe[key]);
    }
  }

  return safe;
}