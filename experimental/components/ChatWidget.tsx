'use client';

import { useState, useCallback } from 'react';
import { Send, Upload, Loader2 } from 'lucide-react';
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
  onDataRefresh?: () => void;
}

function safeDevLog(label: string, data: unknown) {
  if (process.env.NODE_ENV !== 'development') return;
  console.log(label, data);
}

export default function ChatWidget({ selectedStory, selectedEpic, conversations, setConversations, onDataRefresh }: ChatWidgetProps) {
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

  // Helper function to detect if message contains exportable content
  const detectExportableContent = (content: string) => {
    const hasTestCases = content.includes('**TEST CASES:**') || content.includes('**Test Case');
    const hasUserStories = content.includes('**USER STORIES:**') || content.includes('**User Story');
    return { hasTestCases, hasUserStories };
  };

  // Helper function to detect if user is confirming export
  const detectExportConfirmation = (userMessage: string, messages: Message[]) => {
    const normalizedMessage = userMessage.toLowerCase().trim();
    
    // Positive confirmation patterns
    const positivePatterns = [
      /^(yes|y|yeah|yep|yup)$/,
      /^(ok|okay|k)$/,
      /^(sure|absolutely|definitely)$/,
      /^(go ahead|do it|proceed)$/,
      /^(confirm|confirmed)$/,
      /^(please|pls).*export/,
      /^export/,
      /yes.*export/,
      /export.*yes/,
      /^(correct|right|good)$/,
      /^(let'?s do it|let'?s go)$/,
      /^(continue|go on)$/,
      /^(sounds good|looks good)$/,
      /^\u2705/, // Checkmark emoji
      /^\ud83d\ude80/, // Rocket emoji
      /^\ud83d\udc4d/, // Thumbs up emoji
    ];

    const isPositive = positivePatterns.some(pattern => pattern.test(normalizedMessage));
    
    if (!isPositive) {
      return { shouldExport: false, lastBotMessage: null, exportType: null };
    }

    // Find the last bot message that contains exportable content
    const botMessages = messages.filter(m => m.role === 'bot').reverse();
    
    for (const botMessage of botMessages) {
      const exportableContent = detectExportableContent(botMessage.content);
      
      // Check if the message contains follow-up questions about export
      const hasExportQuestion = 
        botMessage.content.includes('Would you like to export') ||
        botMessage.content.includes('Would you like to add these') ||
        botMessage.content.includes('export these to Jira') ||
        botMessage.content.includes('add these to the epic in Jira');
      
      if (hasExportQuestion) {
        if (exportableContent.hasTestCases) {
          return { 
            shouldExport: true, 
            lastBotMessage: botMessage, 
            exportType: 'test_case' as const 
          };
        } else if (exportableContent.hasUserStories) {
          return { 
            shouldExport: true, 
            lastBotMessage: botMessage, 
            exportType: 'story' as const 
          };
        }
      }
    }

    return { shouldExport: false, lastBotMessage: null, exportType: null };
  };

  // Parse AI content into structured format
  const parseAIContent = (content: string, type: 'test_case' | 'story') => {
    if (type === 'test_case') {
      return parseTestCases(content);
    } else {
      return parseUserStories(content);
    }
  };

  // Parse test cases from AI response
  const parseTestCases = (content: string) => {
    const testCases = [];
    const testCaseBlocks = content.split(/\*\*Test Case \d+:/);
    
    for (let i = 1; i < testCaseBlocks.length; i++) {
      const block = testCaseBlocks[i].trim();
      const lines = block.split('\n').filter(line => line.trim());
      
      const title = lines[0]?.replace(/\*\*/g, '').trim();
      let description = '';
      let steps = '';
      let expected_result = '';
      
      let currentSection = '';
      
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        
        if (line.startsWith('- **Description:**')) {
          currentSection = 'description';
          description = line.replace('- **Description:**', '').trim();
        } else if (line.startsWith('- **Steps:**')) {
          currentSection = 'steps';
        } else if (line.startsWith('- **Expected Result:**')) {
          currentSection = 'expected_result';
          expected_result = line.replace('- **Expected Result:**', '').trim();
        } else if (line.match(/^\d+\./)) {
          if (currentSection === 'steps') {
            steps += (steps ? '\n' : '') + line;
          }
        } else if (line.length > 0 && !line.startsWith('**') && !line.startsWith('Are these')) {
          if (currentSection === 'description' && !line.startsWith('- **')) {
            description += (description ? ' ' : '') + line.replace(/^- /, '');
          } else if (currentSection === 'expected_result' && !line.startsWith('- **')) {
            expected_result += (expected_result ? ' ' : '') + line.replace(/^- /, '');
          }
        }
      }
      
      if (title && description) {
        testCases.push({
          title,
          description,
          steps: steps || 'Steps to be defined',
          expected_result: expected_result || 'Expected result to be defined'
        });
      }
    }
    
    return testCases;
  };

  // Parse user stories from AI response
  const parseUserStories = (content: string) => {
    const userStories = [];
    const storyBlocks = content.split(/\*\*User Story \d+:/);
    
    for (let i = 1; i < storyBlocks.length; i++) {
      const block = storyBlocks[i].trim();
      const lines = block.split('\n').filter(line => line.trim());
      
      const title = lines[0]?.replace(/\*\*/g, '').trim();
      let description = '';
      let acceptance_criteria = '';
      let priority = 'Medium';
      
      let currentSection = '';
      
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        
        if (line.startsWith('- **Description:**')) {
          currentSection = 'description';
          description = line.replace('- **Description:**', '').trim();
        } else if (line.startsWith('- **Acceptance Criteria:**')) {
          currentSection = 'acceptance_criteria';
        } else if (line.startsWith('- **Priority:**')) {
          currentSection = 'priority';
          priority = line.replace('- **Priority:**', '').trim();
        } else if (line.startsWith('•')) {
          if (currentSection === 'acceptance_criteria') {
            acceptance_criteria += (acceptance_criteria ? '\n' : '') + line;
          }
        } else if (line.length > 0 && !line.startsWith('**') && !line.startsWith('Are these')) {
          if (currentSection === 'description' && !line.startsWith('- **')) {
            description += (description ? ' ' : '') + line.replace(/^- /, '');
          }
        }
      }
      
      if (title && description) {
        userStories.push({
          title,
          description,
          acceptance_criteria: acceptance_criteria || 'Acceptance criteria to be defined',
          priority: priority || 'Medium'
        });
      }
    }
    
    return userStories;
  };

  const handleSend = async (messageToSend?: string, requestType?: 'general' | 'test-cases' | 'user-stories') => {
    const messageContent = messageToSend || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent
    };

    // Check if this is a positive response to export question
    const isExportConfirmation = detectExportConfirmation(messageContent, currentMessages);
    
    // Add message to current conversation
    setConversations(prev => ({
      ...prev,
      [conversationKey]: [...(prev[conversationKey] || []), userMessage]
    }));
    setInputValue('');

    // If this is an export confirmation, send special message to AI to trigger MCP tools
    if (isExportConfirmation.shouldExport) {
      const { lastBotMessage, exportType } = isExportConfirmation;
      console.log('🎉 Export confirmation detected:', {
        userMessage: messageContent,
        exportType,
        hasContext: !!(selectedStory || selectedEpic)
      });
      
      if (lastBotMessage && (selectedStory || selectedEpic)) {
        setIsLoading(true);
        setError(null);

        try {
          // Create context for the export request
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

          const parentKey = exportType === 'test_case' ? selectedStory?.key : selectedEpic?.key;

          // Parse the AI content and export directly using our backend
          const items = parseAIContent(lastBotMessage.content, exportType);
          
          console.log('Parsed items for export:', items);
          console.log('Export type:', exportType);
          console.log('Parent key:', parentKey);
          
          if (!items || items.length === 0) {
            throw new Error('No valid items found to export');
          }
          
          const response = await fetch('/api/export-items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important: include cookies
            body: JSON.stringify({
              type: exportType,
              parentKey,
              items
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          // Create success message with issue keys
          const successfulItems = result.results.filter((r: any) => r.success);
          const failedItems = result.results.filter((r: any) => !r.success);
          
          let responseMessage = '';
          if (successfulItems.length > 0) {
            const issueKeys = successfulItems.map((r: any) => r.issueKey).join(', ');
            responseMessage += `✅ Successfully created ${successfulItems.length} ${exportType === 'test_case' ? 'test cases' : 'user stories'} in Jira:\n${issueKeys}\n\n🔄 Refreshing dashboard to show new items...`;
          }
          
          if (failedItems.length > 0) {
            responseMessage += `\n\n❌ Failed to create ${failedItems.length} items:`;
            failedItems.forEach((item: any) => {
              responseMessage += `\n• ${item.item}: ${item.error}`;
            });
          }

          const botMessage: Message = {
            id: generateId(),
            role: 'bot',
            content: responseMessage
          };

          // Add bot response to conversation
          setConversations(prev => ({
            ...prev,
            [conversationKey]: [...(prev[conversationKey] || []), botMessage]
          }));

          // Refresh the dashboard data to show new items
          if (onDataRefresh && successfulItems.length > 0) {
            console.log('🔄 Triggering data refresh after successful export');
            setTimeout(() => {
              onDataRefresh();
            }, 1000); // Small delay to ensure Jira has processed the items
          }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Export failed';
          console.error('Export error:', err);
          setError(`Export failed: ${errorMessage}`);
          
          // Provide helpful error message based on error type
          let helpfulMessage = `❌ Export failed: ${errorMessage}`;
          
          if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
            helpfulMessage += '\n\n🔄 Your session may have expired. Please refresh the page and try again.';
          } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
            helpfulMessage += '\n\n🔒 You may not have permission to create items in this project. Please check your Jira permissions.';
          } else if (errorMessage.includes('No valid items')) {
            helpfulMessage += '\n\n📝 Please try generating new content first, then confirm the export.';
          } else {
            helpfulMessage += '\n\n🔧 Please check your Jira connection and try again.';
          }
          
          // Add error message to conversation  
          const errorBotMessage = {
            id: generateId(),
            role: 'bot' as const,
            content: helpfulMessage
          };

          setConversations(prev => ({
            ...prev,
            [conversationKey]: [...(prev[conversationKey] || []), errorBotMessage]
          }));
        } finally {
          setIsLoading(false);
        }
        return; // Don't continue with normal chat flow
      }
    }

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