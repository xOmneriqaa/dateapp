import { Button } from "@/components/ui/button";
import { Heart, User, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";

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
}

export function MatchCard({ match, onSendRequest }: MatchCardProps) {
  return (
    <div className="border-2 border-black shadow-3d-sm p-6 bg-white hover:shadow-3d transition-all">
      <div className="flex items-start gap-4">
        {/* Profile Photo */}
        <div className="w-20 h-20 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex-shrink-0">
          {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
            <img
              src={match.otherUser.photos[0]}
              alt={match.otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
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

      {/* Action */}
      <div className="mt-4">
        {match.hasActiveChat ? (
          <Link
            to="/chat/$chatId"
            params={{ chatId: match.chatSessionId! }}
          >
            <Button variant="outline" className="w-full gap-2">
              <Heart className="h-4 w-4" />
              View Chat
            </Button>
          </Link>
        ) : match.hasPendingRequest ? (
          <Button
            variant="outline"
            className="w-full"
            disabled
          >
            {match.isRequestSender
              ? 'Request Pending...'
              : 'Incoming Request'}
          </Button>
        ) : (
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => onSendRequest(match._id)}
          >
            <Send className="h-4 w-4" />
            Send Chat Request
          </Button>
        )}
      </div>
    </div>
  );
}
