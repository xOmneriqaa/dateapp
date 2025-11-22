import { useEffect, useRef } from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface Message {
  _id: Id<"messages">;
  senderId: string;
  content: string;
  createdAt: number;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
}

export function ChatMessages({ messages, currentUserId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4 bg-background">
      {messages.length === 0 && (
        <div className="text-center text-muted-foreground">
          <p>No messages yet. Say hi!</p>
        </div>
      )}
      {messages.map((message) => {
        const isMyMessage = message.senderId === currentUserId;
        return (
          <div
            key={message._id}
            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-5 py-4 rounded-2xl shadow-soft text-sm tracking-tight ${
                isMyMessage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/80 text-foreground border border-border'
              }`}
            >
              <p className="break-words">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
