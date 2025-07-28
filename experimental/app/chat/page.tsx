import ChatWidget from '../../components/ChatWidget';

export default function ChatPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md h-[600px] bg-white shadow-xl rounded-lg">
        <ChatWidget />
      </div>
    </div>
  );
}