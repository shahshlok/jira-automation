import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
}

function safeServerLog(label: string, data: unknown) {
  if (process.env.NODE_ENV !== 'development') return;
  // Never log sensitive data like API keys or tokens
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    // Remove any potential sensitive fields
    delete (sanitized as any).authorization;
    delete (sanitized as any).apiKey;
    delete (sanitized as any).token;
    console.log(label, sanitized);
  } else {
    console.log(label, data);
  }
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
      safeServerLog('No OpenAI API key configured, using stub response', {});
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return NextResponse.json({
        content: "(pretend AI reply)"
      });
    }

    // General purpose system prompt for unified chat
    const systemPrompt = 'You are a helpful assistant that can help with various software development tasks including generating test cases, user stories, code reviews, and answering technical questions. Provide clear, practical, and actionable responses.';

    safeServerLog('Making OpenAI API request', { messageLength: message.length });

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
      safeServerLog('OpenAI API error', { status: response.status, statusText: response.statusText });
      
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      safeServerLog('Unexpected OpenAI response format', { hasChoices: !!data.choices });
      
      return NextResponse.json(
        { error: 'Unexpected response format from OpenAI' },
        { status: 500 }
      );
    }

    const content = data.choices[0].message.content;
    safeServerLog('OpenAI response received', { contentLength: content?.length });

    return NextResponse.json({
      content: content
    });

  } catch (error) {
    safeServerLog('Chat API error', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}