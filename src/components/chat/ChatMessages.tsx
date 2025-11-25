import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Id } from "../../../convex/_generated/dataModel";
import { ChevronDown } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";

interface Message {
  _id: Id<"messages">;
  senderId: string;
  content: string;
  createdAt: number;
  messageType?: "text" | "image";
  imageUrl?: string | null;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  profileRevealCard?: ReactNode; // Optional inline profile card for when profiles are revealed
  profileRevealedAt?: number; // Timestamp when match was created (to position card correctly)
}

export function ChatMessages({ messages, currentUserId, profileRevealCard, profileRevealedAt }: ChatMessagesProps) {
  // Find the index where the profile card should be inserted
  // It should appear after all messages that were sent before the match
  const profileCardIndex = useMemo(() => {
    if (!profileRevealCard || !profileRevealedAt) return -1;

    // Find the first message that was sent AFTER the match was created
    const index = messages.findIndex(msg => msg.createdAt >= profileRevealedAt);

    // If no messages after match, show at end of existing messages
    if (index === -1) return messages.length;

    return index;
  }, [messages, profileRevealCard, profileRevealedAt]);

  return (
    <StickToBottom
      className="flex-1 min-h-0 relative bg-background overflow-hidden"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="px-6 py-8 space-y-4">
        {messages.length === 0 && !profileRevealCard && (
          <div className="text-center text-muted-foreground">
            <p>No messages yet. Say hi!</p>
          </div>
        )}

        {/* Render messages with profile card inserted at correct position */}
        {messages.map((message, index) => {
          const isMyMessage = message.senderId === currentUserId;
          return (
            <div key={message._id}>
              {/* Insert profile card before this message if this is the right spot */}
              {profileRevealCard && index === profileCardIndex && (
                <div className="py-4 mb-4">
                  {profileRevealCard}
                </div>
              )}

              <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {message.messageType === "image" && message.imageUrl ? (
                  <ImageMessage
                    imageUrl={message.imageUrl}
                    isMyMessage={isMyMessage}
                    createdAt={message.createdAt}
                  />
                ) : (
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
                )}
              </div>
            </div>
          );
        })}

        {/* Show profile card at the end if no messages came after the match */}
        {profileRevealCard && profileCardIndex === messages.length && (
          <div className="py-4">
            {profileRevealCard}
          </div>
        )}
      </StickToBottom.Content>

      {/* Scroll indicator - shows "New messages" or "Scroll to bottom" */}
      <ScrollIndicator messageCount={messages.length} />
    </StickToBottom>
  );
}

function ScrollIndicator({ messageCount }: { messageCount: number }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const lastSeenCountRef = useRef(messageCount);

  // Calculate hasNewMessages during render (no useEffect needed)
  // When at bottom, update the ref to current count
  if (isAtBottom) {
    lastSeenCountRef.current = messageCount;
  }

  // Derive hasNewMessages from current state
  const hasNewMessages = !isAtBottom && messageCount > lastSeenCountRef.current;

  if (isAtBottom) return null;

  return (
    <button
      onClick={() => scrollToBottom({ animation: 'smooth' })}
      className="absolute bottom-4 left-1/2 -translate-x-1/2
                 flex items-center gap-2 px-4 py-2
                 bg-primary text-primary-foreground
                 rounded-full shadow-lg border-2 border-border
                 hover:scale-105 transition-transform"
    >
      <ChevronDown className="h-4 w-4" />
      <span className="text-sm font-medium">
        {hasNewMessages ? 'New messages' : 'Scroll to bottom'}
      </span>
    </button>
  );
}

interface ImageMessageProps {
  imageUrl: string;
  isMyMessage: boolean;
  createdAt: number;
}

function ImageMessage({ imageUrl, isMyMessage, createdAt }: ImageMessageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div
        className={`max-w-[70%] p-2 rounded-2xl shadow-soft ${
          isMyMessage
            ? 'bg-primary'
            : 'bg-card/80 border border-border'
        }`}
      >
        <img
          src={imageUrl}
          alt="Shared image"
          className="max-h-64 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsFullscreen(true)}
        />
        <p className={`text-xs mt-2 px-2 opacity-70 ${isMyMessage ? 'text-primary-foreground' : 'text-foreground'}`}>
          {new Date(createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={imageUrl}
            alt="Shared image"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
