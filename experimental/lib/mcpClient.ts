import axios from 'axios';

// MCP client to communicate directly with the authorized MCP server
class MCPClient {
  private baseUrl: string;
  private clientId: string;

  constructor() {
    this.baseUrl = 'http://localhost:5598'; // Local MCP proxy
    this.clientId = 'mcp-jira-client';
  }

  async callTool(toolName: string, parameters: any) {
    try {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: parameters
        }
      };

      console.log('MCP Request:', JSON.stringify(request, null, 2));

      const response = await axios.post(this.baseUrl, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      console.log('MCP Response:', JSON.stringify(response.data, null, 2));

      if (response.data.error) {
        throw new Error(`MCP Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error('MCP Client Error:', error.message);
      throw error;
    }
  }

  async listTools() {
    try {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list'
      };

      const response = await axios.post(this.baseUrl, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      return response.data.result?.tools || [];
    } catch (error: any) {
      console.error('MCP List Tools Error:', error.message);
      return [];
    }
  }

  async createIssue(issueData: {
    projectKey: string;
    summary: string;
    description: string;
    issueType: string;
    parentKey?: string;
    epicKey?: string;
  }) {
    return this.callTool('create_issue', {
      project: issueData.projectKey,
      summary: issueData.summary,
      description: issueData.description,
      issuetype: issueData.issueType,
      ...(issueData.parentKey && { parent: issueData.parentKey }),
      ...(issueData.epicKey && { epic: issueData.epicKey })
    });
  }

  async searchIssues(jql: string) {
    return this.callTool('search_issues', {
      jql: jql,
      maxResults: 50
    });
  }
}

export const mcpClient = new MCPClient();