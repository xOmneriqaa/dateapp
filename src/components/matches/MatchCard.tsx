import { Button } from "@/components/ui/button";
import { Heart, User, Send, Trash2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

interface MatchCardProps {
  match: {
    _id: Id<"matches">;
    matchedAt: number;
    hasActiveChat: boolean;
    chatSessionId?: string;
    hasPendingRequest: boolean;
    isRequestSender: boolean;
    otherUser?: {
      name?: string;
      age?: number;
      gender?: string;
      bio?: string;
      photos?: string[];
    } | null;
  };
  onSendRequest: (matchId: Id<"matches">) => void;
  onDelete: (matchId: Id<"matches">) => void;
}

export function MatchCard({ match, onSendRequest, onDelete }: MatchCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const primaryAction = () => {
    if (match.hasActiveChat) {
      return (
        <Link to="/chat/$chatId" params={{ chatId: match.chatSessionId! }}>
          <Button variant="outline" className="w-full gap-2">
            <Heart className="h-4 w-4" />
            View Chat
          </Button>
        </Link>
      );
    }

    if (match.hasPendingRequest) {
      return (
        <Button variant="outline" className="w-full" disabled>
          {match.isRequestSender ? 'Request Pending...' : 'Incoming Request'}
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        className="w-full gap-2"
        onClick={() => onSendRequest(match._id)}
      >
        <Send className="h-4 w-4" />
        Send Chat Request
      </Button>
    );
  };

  const handleDelete = () => {
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(match._id);
      setShowModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="border border-border shadow-soft-sm p-6 bg-card/80 hover:shadow-soft-lg transition-all rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full border border-border overflow-hidden bg-muted/50 flex-shrink-0">
            {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
              <img
                src={match.otherUser.photos[0]}
                alt={match.otherUser.name ?? 'Match photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold mb-1">
              {match.otherUser?.name || 'Anonymous'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {match.otherUser?.age ? `${match.otherUser.age} years old` : 'Age not set'}
              {match.otherUser?.gender &&
                ` • ${match.otherUser.gender.charAt(0).toUpperCase() + match.otherUser.gender.slice(1)}`}
            </p>
            {match.otherUser?.bio ? (
              <p className="text-sm line-clamp-2 mb-3">
                {match.otherUser.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic mb-3">
                No bio yet
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Matched{' '}
              {new Date(match.matchedAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="flex-1">{primaryAction()}</div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            title="Remove match"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border shadow-soft-lg max-w-md w-full p-6 space-y-4 rounded-2xl">
            <div>
              <h3 className="text-2xl font-bold mb-2">Remove this match?</h3>
              <p className="text-sm text-muted-foreground">
                You will no longer be able to start chats with {match.otherUser?.name || 'this user'}.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </span>
                ) : (
                  'Remove Match'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
