'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Story } from '@/lib/apiHelpers';
import { EpicWithStories } from '@/lib/dashboard/types';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

interface ChatWidgetProps {
  selectedStory?: Story | null;
  selectedEpic?: EpicWithStories | null;
  conversations: Record<string, Message[]>;
  setConversations: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
}

function safeDevLog(label: string, data: unknown) {
  if (process.env.NODE_ENV !== 'development') return;
  console.log(label, data);
}

export default function ChatWidget({ selectedStory, selectedEpic, conversations, setConversations }: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current conversation key based on selected story/epic
  const getCurrentConversationKey = useCallback(() => {
    if (selectedStory) {
      return `story-${selectedStory.key}`;
    } else if (selectedEpic) {
      return `epic-${selectedEpic.key}`;
    }
    return 'general';
  }, [selectedStory, selectedEpic]);

  // Get current messages for the active conversation
  const conversationKey = getCurrentConversationKey();
  const currentMessages = conversations[conversationKey] || [];

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const handleSend = async (messageToSend?: string, requestType?: 'general' | 'test-cases' | 'user-stories') => {
    const messageContent = messageToSend || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent
    };

    // Add message to current conversation
    setConversations(prev => ({
      ...prev,
      [conversationKey]: [...(prev[conversationKey] || []), userMessage]
    }));
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare context for AI calls
      const context = {
        story: selectedStory ? {
          key: selectedStory.key,
          summary: selectedStory.summary,
          epicLink: selectedStory.epicLink
        } : undefined,
        epic: selectedEpic ? {
          key: selectedEpic.key,
          summary: selectedEpic.summary
        } : undefined
      };

      // Always use our secure backend API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          type: requestType || 'general',
          context
        }),
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

      // Add bot response to current conversation
      setConversations(prev => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), botMessage]
      }));
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

  const handleSuggestionClick = (suggestion: string, requestType?: 'general' | 'test-cases' | 'user-stories') => {
    handleSend(suggestion, requestType);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Empty state or welcome message when no messages */}
      {currentMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-gray-700 mb-2">Hi, how can I help you?</h2>
            <p className="text-gray-500 text-sm">Use the buttons below or type your question to get started</p>
            {(selectedStory || selectedEpic) && (
              <p className="text-gray-400 text-xs mt-2">
                Context: {selectedStory ? `Story ${selectedStory.key}` : `Epic ${selectedEpic?.key}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Messages Area - Only show when there are messages */}
      {currentMessages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {currentMessages.map((message) => (
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
                {message.role === 'bot' ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-gray-900">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
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
              onClick={() => {
                if (selectedStory) {
                  handleSuggestionClick(`Generate exactly 5 test cases for the user story: ${selectedStory.summary}`, 'test-cases');
                } else {
                  handleSuggestionClick("Generate comprehensive test case ideas for software features, including edge cases, positive scenarios, and negative scenarios.");
                }
              }}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 h-auto rounded-full border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Generate Tests {selectedStory && `(${selectedStory.key})`}
            </Button>
            <Button
              onClick={() => {
                if (selectedEpic) {
                  handleSuggestionClick(`Generate 3 user stories for the epic: ${selectedEpic.summary}`, 'user-stories');
                } else {
                  handleSuggestionClick("Generate creative and detailed user story ideas following the 'As a [user], I want [goal] so that [benefit]' format.");
                }
              }}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1.5 h-auto rounded-full border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Generate Stories {selectedEpic && `(${selectedEpic.key})`}
            </Button>
          </div>

          {/* Input Field Row */}
          <div className="flex items-center space-x-3">
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
              className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 transition-all duration-200 hover:scale-105 active:scale-95 transform"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}