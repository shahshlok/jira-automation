'use client';

import { useState } from 'react';
import ChatWidget from '../../components/ChatWidget';

// Message interface for chat conversations
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md h-[600px] bg-white shadow-xl rounded-lg">
        <ChatWidget 
          conversations={conversations}
          setConversations={setConversations}
        />
      </div>
    </div>
  );
}