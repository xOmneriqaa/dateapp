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
    <div className="max-w-md mx-auto">
      {/* Match celebration header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">It's a Match!</span>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Profile card */}
      <div className="border-2 border-border rounded-2xl overflow-hidden bg-card shadow-lg">
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
              <User className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
              {otherUser.name || 'Anonymous'}
              {otherUser.age && <span className="font-normal">, {otherUser.age}</span>}
            </h3>
            {otherUser.gender && (
              <p className="text-sm text-white/80 drop-shadow">
                {otherUser.gender.charAt(0).toUpperCase() + otherUser.gender.slice(1)}
              </p>
            )}
          </div>
        </div>

        {/* Bio section */}
        <div className="p-4 border-t border-border">
          {otherUser.bio ? (
            <p className="text-sm text-foreground">{otherUser.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No bio yet
            </p>
          )}
        </div>
      </div>

      {/* Continue chatting hint */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Keep chatting to get to know each other better!
      </p>
    </div>
  );
}
