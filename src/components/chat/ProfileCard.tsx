import { User } from "lucide-react";

interface ProfileCardProps {
  otherUser: {
    name?: string;
    age?: number;
    gender?: string;
    bio?: string;
    photos?: string[];
  };
}

export function ProfileCard({ otherUser }: ProfileCardProps) {
  return (
    <div className="border-b border-border px-6 py-3 bg-card/50 backdrop-blur">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card">
          <div className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted/40 flex-shrink-0">
            {otherUser.photos && otherUser.photos.length > 0 ? (
              <img
                src={otherUser.photos[0]}
                alt={otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium">{otherUser.name || 'Anonymous'}</h3>
            <p className="text-xs text-muted-foreground">
              {otherUser.age ? `${otherUser.age} years old` : 'Age not set'}
              {otherUser.age && otherUser.gender && ' • '}
              {otherUser.gender && `${otherUser.gender.charAt(0).toUpperCase() + otherUser.gender.slice(1)}`}
            </p>
            {otherUser.bio ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{otherUser.bio}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground/70 italic">
                No bio yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
