'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWidget from './ChatWidget';
import { Story } from '@/lib/apiHelpers';
import { EpicWithStories } from '@/lib/dashboard/types';

// Message interface for chat conversations
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

interface ChatPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStory?: Story | null;
  selectedEpic?: EpicWithStories | null;
  conversations: Record<string, Message[]>;
  setConversations: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  onDataRefresh?: () => void;
}

export const ChatPopup = ({ open, onOpenChange, selectedStory, selectedEpic, conversations, setConversations, onDataRefresh }: ChatPopupProps) => {
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const handleButtonClick = () => {
    if (!open) {
      // Starting to open - trigger spin animation
      setIsSpinning(true);
      // Stop spinning after animation completes
      setTimeout(() => setIsSpinning(false), 600);
    }
    onOpenChange(!open);
  };

  return (
    <>
      {/* AI Button - Always visible */}
      <Button 
        onClick={handleButtonClick}
        className="fixed bottom-6 right-6 w-15 h-15 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg p-2 [&_svg]:!w-8 [&_svg]:!h-8 z-40 transition-transform duration-300"
      >
        <Sparkles 
          className={`text-white transition-transform duration-600 ${
            isSpinning ? 'animate-spin' : ''
          }`} 
        />
      </Button>

      {/* Chat Popup */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-50"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Chat Container */}
          <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Chat Widget */}
            <div className="flex-1 overflow-hidden">
              <ChatWidget 
                selectedStory={selectedStory} 
                selectedEpic={selectedEpic}
                conversations={conversations}
                setConversations={setConversations}
                onDataRefresh={onDataRefresh}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile responsive overlay */}
      <style jsx>{`
        @media (max-width: 640px) {
          .fixed.bottom-24.right-6 {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            width: auto;
            height: 70vh;
          }
        }
      `}</style>
    </>
  );
};