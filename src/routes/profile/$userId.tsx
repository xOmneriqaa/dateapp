import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export const Route = createFileRoute('/profile/$userId')({
  component: ProfileViewPage,
});

function ProfileViewPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/matches">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chats
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center py-12 bg-card rounded-xl border border-border fade-in">
          <div className="flex justify-center mb-8">
            <span className="h-20 w-20 rounded-full border border-border flex items-center justify-center">
              <UserRound className="h-10 w-10 text-muted-foreground" />
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-3">Profile View</h2>
          <p className="text-sm text-muted-foreground mb-4">
            View matched user profiles (Coming Soon)
          </p>
          <p className="text-xs text-muted-foreground">
            For now, you can see profiles in the chat when you match!
          </p>
          <p className="text-xs text-muted-foreground/70 mt-4">
            Selected profile id: {userId}
          </p>
        </div>
      </div>
    </div>
  );
}
