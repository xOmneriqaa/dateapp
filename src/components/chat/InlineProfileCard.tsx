import { User, Sparkles } from "lucide-react";

interface InlineProfileCardProps {
  otherUser: {
    name?: string;
    age?: number;
    gender?: string;
    bio?: string;
    photos?: string[];
  };
}

export function InlineProfileCard({ otherUser }: InlineProfileCardProps) {
  return (
    <div className="max-w-[280px] sm:max-w-sm mx-auto">
      {/* Match celebration header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">It's a Match</span>
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Profile card */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Profile photo */}
        <div className="aspect-square bg-muted/40 relative">
          {otherUser.photos && otherUser.photos.length > 0 ? (
            <img
              src={otherUser.photos[0]}
              alt={otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Name overlay */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {otherUser.name || 'Anonymous'}
              {otherUser.age && <span className="font-normal text-white/80">, {otherUser.age}</span>}
            </h3>
            {otherUser.gender && (
              <p className="text-[10px] sm:text-xs text-white/70">
                {otherUser.gender.charAt(0).toUpperCase() + otherUser.gender.slice(1)}
              </p>
            )}
          </div>
        </div>

        {/* Bio section */}
        <div className="p-3 sm:p-4 border-t border-border">
          {otherUser.bio ? (
            <p className="text-xs sm:text-sm text-foreground">{otherUser.bio}</p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              No bio yet
            </p>
          )}
        </div>
      </div>

      {/* Continue chatting hint */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
        Keep chatting to get to know each other!
      </p>
    </div>
  );
}
