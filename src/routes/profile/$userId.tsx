import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ArrowLeft, UserRound } from 'lucide-react';

export const Route = createFileRoute('/profile/$userId')({
  component: ProfileViewPage,
});

function ProfileViewPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  // We'll need to create a query to fetch user profiles
  // For now, let's show a coming soon message

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    navigate({ to: '/login' });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6 bg-card/70 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/matches">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Back to Matches
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center py-16 bg-card/80 rounded-2xl shadow-soft-lg border border-border fade-in">
          <div className="flex justify-center mb-10">
            <span className="h-24 w-24 rounded-full border border-border flex items-center justify-center">
              <UserRound className="h-12 w-12" />
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Profile View</h2>
          <p className="text-lg text-muted-foreground mb-6">
            View matched user profiles (Coming Soon)
          </p>
          <p className="text-sm text-muted-foreground">
            For now, you can see profiles in the chat when you match!
          </p>
        </div>
      </div>
    </div>
  );
}
