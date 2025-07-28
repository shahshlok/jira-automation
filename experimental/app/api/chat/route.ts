import { NextRequest, NextResponse } from 'next/server';
import { safeLog } from '@/lib/backend/jiraHelpers';
import { generateChat } from '@/src/openaiService';

interface ChatRequest {
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback to stub response if no API key is configured
      safeLog({}, 'No OpenAI API key configured, using stub response', 'warn');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return NextResponse.json({
        content: "(pretend AI reply)"
      });
    }

    // General purpose system prompt for unified chat
    const jsonMode = process.env.OPENAI_JSON_MODE === 'true';
    const systemPrompt = jsonMode 
      ? 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. You must respond with valid JSON format.'
      : 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. Provide clear, practical, and actionable responses.';

    safeLog({ messageLength: message.length }, 'Making OpenAI API request', 'debug');

    // Use the new generateChat function from openaiService
    const content = await generateChat([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: message
      }
    ]);

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