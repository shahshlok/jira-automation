# Jira Export Process Documentation

## Overview

This document explains the complete process for exporting AI-generated test cases and user stories to Jira using direct API integration.

## Architecture

The export functionality uses **Direct Jira API Integration** instead of Model Context Protocol (MCP) due to compatibility limitations with OpenAI's current MCP client support.

### Key Components

1. **Authentication System** - OAuth 2.0 with Atlassian
2. **Chat Interface** - AI-powered conversation for generating test cases/user stories
3. **Export API** - Direct Jira REST API integration
4. **Response Processing** - Automatic detection of export confirmation

## Step-by-Step Export Process

### 1. Initial Setup & Authentication

**User Action**: Navigate to the application and authenticate with Atlassian

**Process**:
- User visits `/api/auth/atlassian` endpoint
- OAuth 2.0 flow initiates with required scopes:
  - `read:jira-work` - Read Jira issues and projects
  - `write:jira-work` - Create and modify Jira issues
  - `read:jira-user` - Access user information
  - `manage:jira-configuration` - Access project metadata
- After successful authentication, tokens are stored in secure HTTP-only cookies
- User is redirected back to the main application

### 2. Content Generation

**User Action**: Interact with the AI chat interface to generate content

**Process**:
- User describes requirements for test cases or user stories
- AI uses OpenAI's Response API to generate structured content
- AI automatically offers to export the generated content to Jira
- Example AI response: *"Would you like me to export these test cases to Jira?"*

### 3. Export Confirmation Detection

**User Action**: Respond positively to export offer (e.g., "yes", "sure", "please do")

**Process**:
- Chat interface monitors user responses for export confirmation keywords
- Positive responses trigger the export workflow automatically
- No additional buttons or manual steps required

### 4. Export Execution

**Automatic Process** triggered by confirmation:

#### 4.1 Authentication Verification
- System checks for valid authentication cookies
- Verifies token permissions and scope compliance
- Tests connectivity with a read operation to validate credentials

#### 4.2 Content Processing
- Parses AI-generated content into structured format
- Extracts key information:
  - **Test Cases**: Title, Description, Steps, Expected Results
  - **User Stories**: Title, Description, Acceptance Criteria
- Formats descriptions using Atlassian Document Format (ADF)

#### 4.3 Jira Issue Creation
For each item to export:
- Constructs Jira issue payload with proper field mapping
- Sets appropriate issue type (`Task` for test cases, `Story` for user stories)
- Links to parent issues (Epic/Story relationships)
- Creates issue via Jira REST API v3
- Handles errors gracefully with detailed logging

#### 4.4 Response & Feedback
- Provides real-time feedback on export progress
- Returns summary of successful/failed exports
- Displays Jira issue keys for successfully created items

## Technical Implementation Details

### Authentication Flow
```
User → /api/auth/atlassian → Atlassian OAuth → /api/auth/callback → Main App
```

### Export API Endpoint
```
POST /api/export-items
{
  "type": "test_case" | "story",
  "parentKey": "PROJECT-123",
  "items": [
    {
      "title": "Test Case Title",
      "description": "Description text",
      "steps": "Test steps",
      "expected_result": "Expected outcome"
    }
  ]
}
```

### Jira API Integration
- **Base URL**: `https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/`
- **Authentication**: Bearer token from OAuth flow
- **Content Format**: Atlassian Document Format (ADF) for rich text fields

### Error Handling
- **Authentication Errors**: Automatic re-authentication prompts
- **Permission Errors**: Clear scope requirement messages
- **API Errors**: Detailed error reporting with resolution suggestions
- **Partial Failures**: Individual item status tracking

## Data Flow

1. **User Input** → AI Processing → Content Generation
2. **Export Confirmation** → Content Parsing → API Payload Creation
3. **Jira API Calls** → Issue Creation → Response Processing
4. **Success/Failure Reporting** → User Notification

## Security Considerations

- OAuth tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Secure token transmission using HTTPS
- Scope-limited permissions (principle of least privilege)
- No sensitive data logged in console outputs
- Automatic token refresh handling

## Supported Content Types

### Test Cases
- **Fields**: Title, Description, Test Steps, Expected Results
- **Jira Issue Type**: Task
- **Parent Relationship**: Links to User Story

### User Stories
- **Fields**: Title, Description, Acceptance Criteria
- **Jira Issue Type**: Story
- **Parent Relationship**: Links to Epic

## Troubleshooting

### Common Issues
1. **"Not authenticated"** - User needs to login via `/api/auth/atlassian`
2. **"Insufficient permissions"** - OAuth app needs proper scopes configured
3. **"ADF format error"** - Description formatting issue (automatically handled)
4. **"Parent issue not found"** - Specified Epic/Story key doesn't exist

### Testing Endpoints
- `/api/test-auth` - Verify basic authentication
- `/api/test-create` - Test issue creation permissions
- `/api/force-reauth` - Clear cookies and force re-authentication

## Future Enhancements

- Bulk export optimization for large datasets
- Custom field mapping configuration
- Export history and audit trail
- Automated parent issue creation
- Integration with additional project management tools

---

*This documentation reflects the current implementation as of the direct API integration approach, replacing the initial MCP-based solution due to client compatibility limitations.*