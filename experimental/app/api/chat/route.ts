import { NextRequest, NextResponse } from 'next/server';
import { safeLog } from '@/lib/backend/jiraHelpers';

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
    const systemPrompt = 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. Provide clear, practical, and actionable responses.';

    safeLog({ messageLength: message.length }, 'Making OpenAI API request', 'debug');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      safeLog({ status: response.status, statusText: response.statusText }, 'OpenAI API error', 'error');
      
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      safeLog({ hasChoices: !!data.choices }, 'Unexpected OpenAI response format', 'error');
      
      return NextResponse.json(
        { error: 'Unexpected response format from OpenAI' },
        { status: 500 }
      );
    }

    const content = data.choices[0].message.content;
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