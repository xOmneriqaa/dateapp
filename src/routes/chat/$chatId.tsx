import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Lock, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { DecisionOverlay } from '@/components/chat/DecisionOverlay';
import { ChatEndedOverlay } from '@/components/chat/ChatEndedOverlay';
import { InlineProfileCard } from '@/components/chat/InlineProfileCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEncryption } from '@/hooks/useEncryption';

// Decision timeout: 30 seconds to respond after other person decides
const DECISION_TIMEOUT_SECONDS = 30;

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [showDecisionUI, setShowDecisionUI] = useState(false);
  const [myDecision, setMyDecision] = useState<boolean | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDeciding, setIsDeciding] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const timerExpiredRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Convex queries - automatically reactive!
  const chatData = useQuery(api.messages.list, {
    chatSessionId: chatId as Id<"chatSessions">,
  });

  const sendMessage = useMutation(api.messages.send);
  const leaveChat = useMutation(api.messages.leaveChat);
  const makeDecision = useMutation(api.decisions.makeDecision);
  const setTyping = useMutation(api.messages.setTyping);
  const skipToReveal = useMutation(api.decisions.skipToReveal);
  const cancelDecision = useMutation(api.decisions.cancelDecision);
  const handleDecisionTimeout = useMutation(api.decisions.handleDecisionTimeout);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const sendImage = useMutation(api.messages.sendImage);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  // E2EE encryption hook
  const {
    encrypt,
    decrypt,
    isE2EEEnabled,
    isReady: encryptionReady,
  } = useEncryption({ chatSessionId: chatId as Id<"chatSessions"> });

  // State for cancel decision and timeout
  const [isCanceling, setIsCanceling] = useState(false);
  const [decisionTimeoutSeconds, setDecisionTimeoutSeconds] = useState<number | undefined>(undefined);
  const decisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle typing indicator with debouncing
  const handleTypingChange = (value: string) => {
    setNewMessage(value);

    // Don't send typing events if chat has ended
    if (chatData?.chatSession?.status !== 'active') return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing and we haven't sent a typing indicator yet
    if (value.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      setTyping({
        chatSessionId: chatId as Id<"chatSessions">,
        isTyping: true,
      }).catch((error) => {
        console.error('Error setting typing status:', error);
      });
    }

    // Set timeout to clear typing indicator after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        setTyping({
          chatSessionId: chatId as Id<"chatSessions">,
          isTyping: false,
        }).catch((error) => {
          console.error('Error clearing typing status:', error);
        });
      }
    }, 3000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (decisionTimeoutRef.current) {
        clearTimeout(decisionTimeoutRef.current);
      }
    };
  }, []);

  // Kick-out detection: if other user cut the connection, redirect to dashboard
  useEffect(() => {
    if (chatData?.wasCutByOtherUser) {
      toast.error('The other user has left the chat', {
        duration: 5000,
      });
      navigate({ to: '/dashboard' });
    }
  }, [chatData?.wasCutByOtherUser, navigate]);

  // Decision timeout: start countdown when waiting for other user's decision
  useEffect(() => {
    // Only start timeout if we're waiting for the other user and we said Yes
    if (showDecisionUI && myDecision === true && chatData?.chatSession?.status === 'waiting_reveal') {
      // Start the timeout countdown
      setDecisionTimeoutSeconds(DECISION_TIMEOUT_SECONDS);

      const interval = setInterval(() => {
        setDecisionTimeoutSeconds((prev) => {
          if (prev === undefined || prev <= 1) {
            clearInterval(interval);
            // Trigger timeout
            handleDecisionTimeout({
              chatSessionId: chatId as Id<"chatSessions">,
            }).then((result) => {
              if (result.timedOut) {
                toast.info('Chat ended - the other user did not respond in time');
              }
            }).catch(console.error);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      decisionTimeoutRef.current = interval;

      return () => {
        clearInterval(interval);
        decisionTimeoutRef.current = null;
      };
    } else {
      // Clear timeout if conditions no longer apply
      setDecisionTimeoutSeconds(undefined);
      if (decisionTimeoutRef.current) {
        clearInterval(decisionTimeoutRef.current);
        decisionTimeoutRef.current = null;
      }
    }
  }, [showDecisionUI, myDecision, chatData?.chatSession?.status, chatId, handleDecisionTimeout]);

  if (!canAccess) {
    return null;
  }

  // Derive chatEnded directly from server state (no useEffect needed)
  // This is calculated during render, not in an effect
  const chatEnded = chatData?.chatSession?.status === 'ended';

  // Handle decision UI
  useEffect(() => {
    if (chatData?.chatSession?.status === 'waiting_reveal' && !showDecisionUI) {
      setShowDecisionUI(true);
    }
  }, [chatData?.chatSession?.status, showDecisionUI]);

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!chatData?.chatSession?.speedDatingEndsAt) return null;
    const now = Date.now();
    const endTime = chatData.chatSession.speedDatingEndsAt;
    const diff = endTime - now;

    if (diff <= 0) return '00:00';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  // Update timer every second and check for expiration
  // Optimized to only update state when value changes (prevents unnecessary re-renders)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const remaining = getTimeRemaining();

      // Only update state if value actually changed (prevents unnecessary re-renders)
      setTimeRemaining((prev) => {
        if (prev === remaining) return prev;
        return remaining;
      });

      // Check if timer just expired (only in speed_dating phase)
      if (
        remaining === '00:00' &&
        chatData?.chatSession?.phase === 'speed_dating' &&
        chatData?.chatSession?.status === 'active' &&
        !timerExpiredRef.current
      ) {
        timerExpiredRef.current = true;
        setShowDecisionUI(true);
        clearInterval(timerInterval); // Stop timer after expiration
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [chatData?.chatSession?.speedDatingEndsAt, chatData?.chatSession?.phase, chatData?.chatSession?.status]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    // Validate message length before encryption
    if (newMessage.trim().length > 2000) {
      toast.error('Message too long (max 2000 characters)');
      return;
    }

    setIsSending(true);
    try {
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      isTypingRef.current = false;

      // Encrypt ALL messages when E2EE is ready (both speed_dating and extended phases)
      const shouldEncrypt = isE2EEEnabled && encryptionReady;

      if (shouldEncrypt) {
        const encrypted = await encrypt(newMessage.trim());
        if (encrypted) {
          await sendMessage({
            chatSessionId: chatId as Id<"chatSessions">,
            content: "[encrypted]", // DO NOT store plaintext - only marker
            encryptedContent: encrypted.ciphertext,
            nonce: encrypted.nonce,
          });
        } else {
          // Encryption failed - DO NOT send unencrypted, show error instead
          console.error('Encryption failed');
          toast.error('Failed to encrypt message. Please try again.');
          return; // Don't send unencrypted message
        }
      } else {
        // Speed dating phase or E2EE not ready - send plaintext
        await sendMessage({
          chatSessionId: chatId as Id<"chatSessions">,
          content: newMessage.trim(),
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveChat = async () => {
    try {
      const result = await leaveChat({ chatSessionId: chatId as Id<"chatSessions"> });
      // For extended/matched chats, navigate to Chats tab (chat persists there)
      // For speed dating, navigate to dashboard (chat was ended)
      if (result.persisted) {
        navigate({ to: '/matches' });
      } else {
        navigate({ to: '/dashboard' });
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
      // On error, default to dashboard
      navigate({ to: '/dashboard' });
    }
  };

  const handleDecision = async (wantsToContinue: boolean) => {
    if (myDecision !== null || isDeciding) return;

    setIsDeciding(true);
    try {
      const result = await makeDecision({
        chatSessionId: chatId as Id<"chatSessions">,
        wantsToContinue,
      });

      setMyDecision(wantsToContinue);

      // If both decided, handle the outcome
      if (result.bothDecided) {
        if (result.matchCreated) {
          toast.success("It's a match! You can now see each other's profiles", {
            duration: 5000,
          });
          setShowDecisionUI(false);
          // Convex will automatically update chatData with new phase
        } else {
          // Chat ended - the overlay will show automatically via chatEnded state
          setShowDecisionUI(false);
          // Note: setChatEnded will be triggered by the useEffect watching chatData.chatSession.status
        }
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
      toast.error('Failed to submit decision. Please try again.');
      setIsDeciding(false); // Only reset on error, otherwise keep disabled
    }
  };

  const handleSkip = async () => {
    if (isSkipping) return;

    setIsSkipping(true);
    try {
      await skipToReveal({
        chatSessionId: chatId as Id<"chatSessions">,
      });
      // No toast - the button will highlight to show the vote
      // Convex will automatically update chatData and skipCount
    } catch (error) {
      console.error('Error skipping:', error);
      toast.error('Failed to skip. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleCancelDecision = async () => {
    if (isCanceling) return;

    setIsCanceling(true);
    try {
      await cancelDecision({
        chatSessionId: chatId as Id<"chatSessions">,
      });
      // Reset decision state
      setMyDecision(null);
      setIsDeciding(false);
      toast.success('Decision canceled - you can decide again');
    } catch (error: any) {
      console.error('Error canceling decision:', error);
      toast.error(error?.message || 'Failed to cancel decision');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    if (isUploading) return;

    setIsUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl({
        chatSessionId: chatId as Id<"chatSessions">,
      });

      // Step 2: Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await result.json();

      // Step 3: Send the image message
      await sendImage({
        chatSessionId: chatId as Id<"chatSessions">,
        storageId,
      });

      toast.success("Image sent!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error?.message || "Failed to send image");
    } finally {
      setIsUploading(false);
    }
  };

  // Loading state
  if (!isLoaded || chatData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state (query failed or returned null)
  if (chatData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold">Unable to Load Chat</h2>
          <p className="text-muted-foreground">
            This chat may not exist, may have ended, or you don't have permission to view it.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: '/dashboard' })}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { messages, chatSession, otherUser, currentUserId, otherUserIsTyping, skipCount, matchedAt } = chatData;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <ChatHeader
        phase={chatSession.phase}
        skipCount={skipCount}
        timeRemaining={timeRemaining}
        isSkipping={isSkipping}
        onLeave={handleLeaveChat}
        onSkip={handleSkip}
      />

      {chatEnded && (
        <ChatEndedOverlay
          myDecision={myDecision}
          onReturnToDashboard={() => navigate({ to: '/dashboard' })}
        />
      )}

      {showDecisionUI && !chatEnded && (
        <DecisionOverlay
          myDecision={myDecision}
          isDeciding={isDeciding}
          onDecision={handleDecision}
          onCancel={handleCancelDecision}
          isCanceling={isCanceling}
          timeoutSeconds={decisionTimeoutSeconds}
        />
      )}

      <ChatMessages
        messages={messages}
        currentUserId={currentUserId}
        profileRevealCard={
          chatSession.phase === 'extended' && otherUser ? (
            <InlineProfileCard otherUser={otherUser} />
          ) : undefined
        }
        profileRevealedAt={matchedAt ?? undefined}
        decrypt={decrypt}
        isE2EEEnabled={isE2EEEnabled}
        encryptionReady={encryptionReady}
        chatSessionId={chatId as Id<"chatSessions">}
      />

      {/* Typing Indicator */}
      {otherUserIsTyping && !chatEnded && (
        <div className="shrink-0 px-6 py-2 bg-card/80 border-t border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="animate-bounce animation-delay-0">●</span>
              <span className="animate-bounce animation-delay-150">●</span>
              <span className="animate-bounce animation-delay-300">●</span>
            </div>
            <span>typing...</span>
          </div>
        </div>
      )}

      <ChatInput
        newMessage={newMessage}
        chatEnded={chatEnded}
        isSending={isSending}
        isExtended={chatSession.phase === 'extended'}
        isUploading={isUploading}
        onTypingChange={handleTypingChange}
        onSendMessage={handleSendMessage}
        onImageSelect={handleImageSelect}
      />
    </div>
  );
}
