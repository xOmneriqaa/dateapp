import { User, Scissors, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getSharedSecret, decryptMessage } from "@/lib/encryption";
import { getOrCreateKeys } from "@/lib/keyStorage";
import { useUser } from "@clerk/tanstack-react-start";

interface ChatListCardProps {
  match: {
    _id: Id<"matches">;
    matchedAt: number;
    lastMessageAt?: number;
    chatSessionId: string;
    currentUserId: Id<"users">;
    lastMessage?: {
      content: string;
      createdAt: number;
      isFromMe: boolean;
      // E2EE fields
      isEncrypted?: boolean;
      encryptedContent?: string;
      nonce?: string;
    } | null;
    otherUser?: {
      _id: Id<"users">;
      name?: string;
      age?: number;
      gender?: string;
      bio?: string;
      photos?: string[];
      publicKey?: string;
    } | null;
  };
  onCutConnection: (matchId: Id<"matches">) => Promise<void>;
}

export function ChatListCard({ match, onCutConnection }: ChatListCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isCutting, setIsCutting] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState<string | null>(null);
  const { user } = useUser();
  const decryptAttemptedRef = useRef<string | null>(null);

  // Decrypt message preview if encrypted
  useEffect(() => {
    const lastMsg = match.lastMessage;
    if (!lastMsg?.isEncrypted || !lastMsg.encryptedContent || !lastMsg.nonce) {
      return;
    }

    if (!match.otherUser?.publicKey || !user?.id) {
      return;
    }

    // Skip if we already attempted decryption for this message
    const messageKey = `${match._id}-${lastMsg.createdAt}`;
    if (decryptAttemptedRef.current === messageKey) {
      return;
    }
    decryptAttemptedRef.current = messageKey;

    const decryptPreview = async () => {
      try {
        // Get or create our keys (deterministic from user ID)
        const keys = await getOrCreateKeys(user.id);

        // Derive shared secret
        const sharedSecret = await getSharedSecret(
          match.currentUserId,
          match.otherUser!._id,
          keys.privateKey,
          match.otherUser!.publicKey!
        );

        // Decrypt the message
        const plaintext = await decryptMessage(
          lastMsg.encryptedContent!,
          lastMsg.nonce!,
          sharedSecret
        );

        if (plaintext) {
          // Truncate for preview
          const preview = plaintext.length > 50 ? plaintext.slice(0, 50) + "..." : plaintext;
          setDecryptedPreview(preview);
        }
      } catch {
        // Silently fail - preview will show "Encrypted message"
      }
    };

    decryptPreview();
  // Use primitive values as dependencies to avoid unnecessary effect runs
  // when object references change but values don't
  }, [
    match._id,
    match.currentUserId,
    match.lastMessage?.createdAt,
    match.lastMessage?.isEncrypted,
    match.lastMessage?.encryptedContent,
    match.lastMessage?.nonce,
    match.otherUser?._id,
    match.otherUser?.publicKey,
    user?.id,
  ]);

  const handleCutConnection = async () => {
    try {
      setIsCutting(true);
      await onCutConnection(match._id);
      setShowModal(false);
    } finally {
      setIsCutting(false);
    }
  };

  // Format time for last message
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const lastActivityTime = match.lastMessageAt ?? match.matchedAt;

  return (
    <>
      <Link to="/chat/$chatId" params={{ chatId: match.chatSessionId }}>
        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer group active:bg-muted/70">
          {/* Profile photo */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-border overflow-hidden bg-muted flex-shrink-0">
            {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
              <img
                src={match.otherUser.photos[0]}
                alt={match.otherUser.name ?? 'Profile photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Chat info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <h3 className="text-sm sm:text-base font-semibold truncate">
                {match.otherUser?.name || 'Anonymous'}
              </h3>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatTime(lastActivityTime)}
              </span>
            </div>

            {/* Last message preview */}
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {match.lastMessage ? (
                <>
                  {match.lastMessage.isFromMe && (
                    <span className="text-muted-foreground/70">You: </span>
                  )}
                  {match.lastMessage.isEncrypted ? (
                    decryptedPreview || <span className="italic text-muted-foreground/70">Encrypted message</span>
                  ) : (
                    match.lastMessage.content
                  )}
                </>
              ) : (
                <span className="italic">Start chatting!</span>
              )}
            </p>
          </div>

          {/* Cut connection button - always visible on mobile, hover on desktop */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
            className="p-2.5 sm:p-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity
                       text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="End chat"
          >
            <Scissors className="h-4 w-4" />
          </button>
        </div>
      </Link>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card border border-border shadow-modal max-w-sm w-full p-4 sm:p-5 space-y-4 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-2">
              <img src="/icons/disconnected.svg" alt="" className="h-14 w-14" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 text-center">End this chat?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This will permanently end your conversation with {match.otherUser?.name || 'this user'}.
                All messages will be deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() => setShowModal(false)}
                disabled={isCutting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[44px]"
                onClick={handleCutConnection}
                disabled={isCutting}
              >
                {isCutting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ending...
                  </span>
                ) : (
                  'End Chat'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
