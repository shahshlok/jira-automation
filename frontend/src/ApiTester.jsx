import React, { useState } from 'react';
import './ApiTester.css';

const ApiTester = () => {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('workflows/search');
  const [queryParams, setQueryParams] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const commonEndpoints = [
    { name: 'Workflows', path: 'workflows/search' },
    { name: 'Projects', path: 'project' },
    { name: 'Issues (JQL)', path: 'search?jql=project=KEY' },
    { name: 'Issue Types', path: 'issuetype' },
    { name: 'Statuses', path: 'status' },
    { name: 'Users', path: 'users/search?query=' },
    { name: 'Myself', path: 'myself' },
    { name: 'Permissions', path: 'mypermissions' },
    { name: 'Fields', path: 'field' },
    { name: 'Priorities', path: 'priority' }
  ];

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);

    try {
      let url = `/api/jira-proxy/${endpoint}`;
      if (queryParams) {
        url += (endpoint.includes('?') ? '&' : '?') + queryParams;
      }

      const config = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (method !== 'GET' && requestBody) {
        config.body = requestBody;
      }

      const res = await fetch(url, config);
      const data = await res.json();
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data
      });
    } catch (error) {
      setResponse({
        status: 'Error',
        statusText: error.message,
        data: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-tester">
      <h2>Jira API Tester</h2>
      
      <div className="request-section">
        <div className="form-row">
          <label>
            Method:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>
          
          <label>
            Endpoint:
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="workflows/search"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Query Parameters (key=value&key2=value2):
            <input
              type="text"
              value={queryParams}
              onChange={(e) => setQueryParams(e.target.value)}
              placeholder="expand=projects&maxResults=50"
            />
          </label>
        </div>

        {method !== 'GET' && (
          <div className="form-row">
            <label>
              Request Body (JSON):
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"name": "Test Issue", "description": "..."}'
                rows="4"
              />
            </label>
          </div>
        )}

        <button onClick={handleTest} disabled={loading}>
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>

      <div className="quick-endpoints">
        <h3>Quick Test Endpoints:</h3>
        <div className="endpoint-buttons">
          {commonEndpoints.map((ep) => (
            <button
              key={ep.path}
              onClick={() => {
                setEndpoint(ep.path);
                setMethod('GET');
                setQueryParams('');
                setRequestBody('');
              }}
              className="endpoint-btn"
            >
              {ep.name}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div className="response-section">
          <h3>Response:</h3>
          <div className="response-meta">
            <span className={`status ${response.status >= 400 ? 'error' : 'success'}`}>
              {response.status} {response.statusText}
            </span>
          </div>
          <pre className="response-body">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTester;