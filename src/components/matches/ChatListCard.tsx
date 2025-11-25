import { User, Scissors, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatListCardProps {
  match: {
    _id: Id<"matches">;
    matchedAt: number;
    lastMessageAt?: number;
    chatSessionId: string;
    lastMessage?: {
      content: string;
      createdAt: number;
      isFromMe: boolean;
    } | null;
    otherUser?: {
      _id: Id<"users">;
      name?: string;
      age?: number;
      gender?: string;
      bio?: string;
      photos?: string[];
    } | null;
  };
  onCutConnection: (matchId: Id<"matches">) => Promise<void>;
}

export function ChatListCard({ match, onCutConnection }: ChatListCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isCutting, setIsCutting] = useState(false);

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
        <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card/80 hover:bg-card hover:shadow-soft transition-all cursor-pointer group">
          {/* Profile photo */}
          <div className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted/50 flex-shrink-0">
            {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
              <img
                src={match.otherUser.photos[0]}
                alt={match.otherUser.name ?? 'Profile photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Chat info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold truncate">
                {match.otherUser?.name || 'Anonymous'}
              </h3>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                {formatTime(lastActivityTime)}
              </span>
            </div>

            {/* Last message preview */}
            <p className="text-sm text-muted-foreground truncate">
              {match.lastMessage ? (
                <>
                  {match.lastMessage.isFromMe && (
                    <span className="text-muted-foreground/70">You: </span>
                  )}
                  {match.lastMessage.content}
                </>
              ) : (
                <span className="italic">Start chatting!</span>
              )}
            </p>
          </div>

          {/* Cut connection button - appears on hover */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity
                       text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
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
            className="bg-card border border-border shadow-soft-lg max-w-md w-full p-6 space-y-4 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">End this chat?</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently end your conversation with {match.otherUser?.name || 'this user'}.
                All messages will be deleted and this chat will disappear for both of you.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={isCutting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
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
