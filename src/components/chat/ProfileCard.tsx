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
    <div className="border-b border-border px-6 py-4 bg-card/80 backdrop-blur">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 p-5 border border-border shadow-soft rounded-2xl bg-card/90">
          <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted/40 flex-shrink-0">
            {otherUser.photos && otherUser.photos.length > 0 ? (
              <img
                src={otherUser.photos[0]}
                alt={otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{otherUser.name || 'Anonymous'}</h3>
            <p className="text-sm text-muted-foreground">
              {otherUser.age ? `${otherUser.age} years old` : 'Age not set'}
              {otherUser.age && otherUser.gender && ' • '}
              {otherUser.gender && `${otherUser.gender.charAt(0).toUpperCase() + otherUser.gender.slice(1)}`}
            </p>
            {otherUser.bio ? (
              <p className="mt-2 text-sm">{otherUser.bio}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground italic">
                No bio yet
              </p>
            )}
          </div>
          <div className="text-4xl">❤️</div>
        </div>
      </div>
    </div>
  );
}
