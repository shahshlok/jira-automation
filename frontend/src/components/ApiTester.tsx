import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ApiResponse {
  status: number | string;
  statusText: string;
  data: any;
}

interface CommonEndpoint {
  name: string;
  path: string;
}

export function ApiTester() {
  const [method, setMethod] = useState<string>('GET');
  const [endpoint, setEndpoint] = useState<string>('workflows/search');
  const [queryParams, setQueryParams] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const commonEndpoints: CommonEndpoint[] = [
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
      let url = `http://localhost:5000/api/jira-proxy/${endpoint}`;
      if (queryParams) {
        url += (endpoint.includes('?') ? '&' : '?') + queryParams;
      }

      const config: RequestInit = {
        method: method,
        credentials: 'include',
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
    } catch (error: any) {
      setResponse({
        status: 'Error',
        statusText: error.message,
        data: { error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndpointSelect = (ep: CommonEndpoint) => {
    setEndpoint(ep.path);
    setMethod('GET');
    setQueryParams('');
    setRequestBody('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Jira API Tester</h1>
        <p className="text-muted-foreground mt-2">
          Test Jira API endpoints directly from the browser
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>API Request Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="workflows/search"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queryParams">Query Parameters</Label>
            <Input
              id="queryParams"
              type="text"
              value={queryParams}
              onChange={(e) => setQueryParams(e.target.value)}
              placeholder="expand=projects&maxResults=50"
            />
            <p className="text-xs text-muted-foreground">
              Format: key=value&key2=value2
            </p>
          </div>

          {method !== 'GET' && (
            <div className="space-y-2">
              <Label htmlFor="requestBody">Request Body (JSON)</Label>
              <Textarea
                id="requestBody"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"name": "Test Issue", "description": "..."}'
                rows={4}
              />
            </div>
          )}

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test API'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Test Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {commonEndpoints.map((ep) => (
              <Button
                key={ep.path}
                variant="outline"
                size="sm"
                onClick={() => handleEndpointSelect(ep)}
                className="text-xs"
              >
                {ep.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Response
              <Badge 
                variant={typeof response.status === 'number' && response.status >= 400 ? 'destructive' : 'default'}
              >
                {response.status} {response.statusText}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-96">
              <pre className="text-sm text-muted-foreground">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}