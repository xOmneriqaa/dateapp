import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Id } from "../../../convex/_generated/dataModel";
import { ChevronDown, Flag, MoreVertical } from "lucide-react";
import { ReactNode, useMemo, useRef, useState, useEffect } from "react";
import { ReportDialog } from "./ReportDialog";

interface Message {
  _id: Id<"messages">;
  senderId: string;
  content: string;
  createdAt: number;
  messageType?: "text" | "image";
  imageUrl?: string | null;
  // E2EE fields
  isEncrypted?: boolean;
  encryptedContent?: string;
  nonce?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  profileRevealCard?: ReactNode;
  profileRevealedAt?: number;
  // E2EE props
  decrypt?: (ciphertext: string, nonce: string) => Promise<string | null>;
  isE2EEEnabled?: boolean;
  encryptionReady?: boolean; // Whether encryption keys are loaded
  chatSessionId?: Id<"chatSessions">;
}

export function ChatMessages({
  messages,
  currentUserId,
  profileRevealCard,
  profileRevealedAt,
  decrypt,
  isE2EEEnabled,
  encryptionReady,
  chatSessionId,
}: ChatMessagesProps) {
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
      <StickToBottom.Content className="px-3 sm:px-6 py-4 sm:py-8 space-y-3 sm:space-y-4">
        {/* E2EE indicator banner */}
        {isE2EEEnabled && (
          <div className="flex items-center justify-center py-2 px-4 mx-auto w-fit
                          bg-green-500/10 text-green-700 dark:text-green-400
                          rounded-full text-xs font-medium border border-green-500/20">
            <span>Messages are end-to-end encrypted</span>
          </div>
        )}

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
                  <TextMessage
                    message={message}
                    isMyMessage={isMyMessage}
                    decrypt={decrypt}
                    encryptionReady={encryptionReady}
                    chatSessionId={chatSessionId}
                  />
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

interface TextMessageProps {
  message: Message;
  isMyMessage: boolean;
  decrypt?: (ciphertext: string, nonce: string) => Promise<string | null>;
  encryptionReady?: boolean;
  chatSessionId?: Id<"chatSessions">;
}

function TextMessage({ message, isMyMessage, decrypt, encryptionReady, chatSessionId }: TextMessageProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Track which message ID we've attempted to decrypt
  // This properly handles component reuse for different messages
  const lastDecryptedMessageIdRef = useRef<string | null>(null);

  // Decrypt encrypted messages
  // This effect IS appropriate - it's an async operation syncing with external crypto system
  useEffect(() => {
    // Skip if not encrypted or missing required data
    if (!message.isEncrypted || !message.encryptedContent || !message.nonce || !decrypt) {
      return;
    }

    // IMPORTANT: Wait for encryption to be ready before attempting decryption
    // This prevents showing "Unable to decrypt" while keys are still loading
    if (!encryptionReady) {
      return;
    }

    // Skip if we already decrypted this exact message
    if (lastDecryptedMessageIdRef.current === message._id) {
      return;
    }

    // Reset state for new message (handles component reuse)
    setDecryptedContent(null);
    setDecryptionError(false);

    // Mark this message as being processed
    lastDecryptedMessageIdRef.current = message._id;

    // Perform decryption
    decrypt(message.encryptedContent, message.nonce)
      .then((plaintext) => {
        // Verify we're still trying to decrypt the same message (guard against race conditions)
        if (lastDecryptedMessageIdRef.current === message._id) {
          if (plaintext) {
            setDecryptedContent(plaintext);
          } else {
            setDecryptionError(true);
          }
        }
      })
      .catch(() => {
        if (lastDecryptedMessageIdRef.current === message._id) {
          setDecryptionError(true);
        }
      });
  }, [message._id, message.isEncrypted, message.encryptedContent, message.nonce, decrypt, encryptionReady]);

  // Determine what to display
  let displayContent: string;
  if (message.isEncrypted) {
    if (decryptedContent) {
      displayContent = decryptedContent;
    } else if (decryptionError) {
      displayContent = "🔒 Unable to decrypt message";
    } else if (!encryptionReady) {
      // Keys still loading from IndexedDB
      displayContent = "🔒 Loading encryption keys...";
    } else {
      displayContent = "🔒 Decrypting...";
    }
  } else {
    displayContent = message.content;
  }

  // Content to include in report (decrypted if available)
  const reportableContent = message.isEncrypted ? (decryptedContent || "[encrypted]") : message.content;

  return (
    <>
      <div className="relative group">
        <div
          className={`inline-block max-w-[70%] px-4 py-3 rounded-2xl shadow-soft text-base ${
            isMyMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-card/80 text-foreground border border-border'
          }`}
          style={{ minWidth: 'fit-content' }}
        >
          <p className="break-words whitespace-pre-wrap">{displayContent}</p>
          <div className="flex items-center mt-1">
            <span className="text-xs opacity-70 whitespace-nowrap">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Menu button - only show for messages from other user */}
        {!isMyMessage && chatSessionId && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-50 bg-background border-2 border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportDialog(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Dialog */}
      {chatSessionId && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          messageId={message._id}
          chatSessionId={chatSessionId}
          messageContent={reportableContent}
        />
      )}
    </>
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
