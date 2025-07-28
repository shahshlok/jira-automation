'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

function safeDevLog(label: string, data: unknown) {
  if (process.env.NODE_ENV !== 'development') return;
  console.log(label, data);
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSend = async (messageToSend?: string) => {
    const messageContent = messageToSend || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Always use our secure backend API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.content;

      const botMessage: Message = {
        id: generateId(),
        role: 'bot',
        content: botResponse
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to get response: ${errorMessage}`);
      safeDevLog('Chat API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Empty state or welcome message when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-700 mb-2">Hi, how can I help you?</h2>
            <p className="text-gray-500 text-sm">Use the buttons below or type your question to get started</p>
          </div>
        </div>
      )}

      {/* Messages Area - Only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Small Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleSuggestionClick("Generate comprehensive test case ideas for software features, including edge cases, positive scenarios, and negative scenarios.")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 h-auto rounded-full border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Generate Tests
            </Button>
            <Button
              onClick={() => handleSuggestionClick("Generate creative and detailed user story ideas following the 'As a [user], I want [goal] so that [benefit]' format.")}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 h-auto rounded-full border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Generate Stories
            </Button>
          </div>

          {/* Input Field Row */}
          <div className="flex items-center space-x-3">
            {/* Plus Button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                disabled={isLoading}
                className="w-full pl-4 pr-4 py-2.5 border-0 bg-gray-50 rounded-full focus:ring-1 focus:ring-blue-400 focus:bg-white transition-all text-sm"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}