import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeLog } from '@/lib/backend/jiraHelpers';
import { generateChat, generateTestCases, generateUserStories } from '@/src/openaiservices';

interface ChatRequest {
  message: string;
  type?: 'general' | 'test-cases' | 'user-stories';
  context?: {
    story?: {
      key: string;
      summary: string;
      epicLink?: string;
    };
    epic?: {
      key: string;
      summary: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, type = 'general', context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPEN_AI_KEY;
    
    if (!apiKey) {
      // Fallback to stub response if no API key is configured
      safeLog({}, 'No OpenAI API key configured, using stub response', 'warn');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return NextResponse.json({
        content: "(pretend AI reply)"
      });
    }

    // Get auth token for MCP authentication
    const cookieStore = await cookies();
    const authToken = cookieStore.get('jira_auth')?.value;

    safeLog({ messageLength: message.length, type, hasAuthToken: !!authToken }, 'Making OpenAI API request', 'debug');

    let content: string;

    if (type === 'test-cases' && context?.story) {
      // Generate test cases with story context
      const storyContext = `${context.story.summary}${context.epic ? ` (Epic: ${context.epic.summary})` : ''}`;
      content = await generateTestCases(storyContext);
    } else if (type === 'user-stories' && context?.epic) {
      // Generate user stories with epic context
      content = await generateUserStories(context.epic.summary);
    } else {
      // General purpose system prompt for unified chat
      let systemPrompt = 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. Provide clear, practical, and actionable responses.';
      
      // Add simple context if available
      if (context?.story) {
        systemPrompt += `\n\nContext: Currently working on User Story ${context.story.key}: ${context.story.summary}`;
      } else if (context?.epic) {
        systemPrompt += `\n\nContext: Currently working on Epic ${context.epic.key}: ${context.epic.summary}`;
      }

      // Use the generateChat function from openaiService
      content = await generateChat([
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ]);
    }

    safeLog({ contentLength: content?.length }, 'OpenAI response received', 'debug');

    return NextResponse.json({
      content: content
    });

  } catch (error) {
    // Log the full error details
    console.error('Chat API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    safeLog(error, 'Chat API error', 'error');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}