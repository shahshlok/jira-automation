import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockChatMessages } from '../../api/mockData';
import type { Story, TestCase } from '../../api/mockData';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotPanelProps {
  story: Story | null;
  testCases: TestCase[];
}

export function ChatBotPanel({ story, testCases }: ChatBotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Mock AI response - replace with real API call
    setTimeout(() => {
      const responses = [
        `I see you're asking about ${story?.key || 'this story'}. Based on the ${testCases.length} test cases, there are some areas that need attention.`,
        `The test coverage shows mixed results. Let me analyze the failure patterns and suggest next steps.`,
        `Looking at the current test status, I recommend focusing on the Breaking and Partial Passing tests first.`,
        `I can help you understand why certain tests are failing. Would you like me to explain the specific issues?`,
        `Based on the test data, this story has ${testCases.filter(tc => tc.status === 'Passing').length} passing tests out of ${testCases.length} total.`
      ];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="bg-white rounded-lg border border-border flex flex-col h-full max-h-96">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand" />
          <h3 className="text-lg font-semibold">AI Test Assistant</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask me about test coverage, failures, or suggestions
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-brand/10 text-brand">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.type === 'user'
                    ? 'bg-brand text-brand-foreground ml-auto'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 opacity-70 ${
                  message.type === 'user' ? 'text-brand-foreground' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              
              {message.type === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-brand/10 text-brand">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-accent text-accent-foreground rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-1">
                  <span>Thinking</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the test bot..."
            disabled={isLoading}
            aria-label="Ask the test bot"
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="px-3"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}