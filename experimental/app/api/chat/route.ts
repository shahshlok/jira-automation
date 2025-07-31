import { NextRequest, NextResponse } from 'next/server';
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

    safeLog({ messageLength: message.length, type }, 'Making OpenAI API request', 'debug');

    let content: string;

    if (type === 'test-cases' && context?.story) {
      // Generate test cases with story context
      content = await generateTestCases({
        title: context.story.summary,
        description: message, // Use the message as additional context
        epicTitle: context.epic?.summary
      });
    } else if (type === 'user-stories' && context?.epic) {
      // Generate user stories with epic context
      content = await generateUserStories(context.epic.summary);
    } else {
      // General purpose system prompt for unified chat
      const jsonMode = process.env.OPENAI_JSON_MODE === 'true';
      const systemPrompt = jsonMode 
        ? 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. You must respond with valid JSON format.'
        : 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. Provide clear, practical, and actionable responses.';

      // Use the new generateChat function from openaiService
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
    safeLog(error, 'Chat API error', 'error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}