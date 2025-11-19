import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, Heart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { useEffect, useRef } from 'react';
import { MatchCard } from '@/components/matches/MatchCard';

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const matches = useQuery(api.matches.list);
  const sendRequest = useMutation(api.chatRequests.send);

  // Track previous matches state to detect when a pending request becomes active
  const prevMatchesRef = useRef(matches);

  const handleSendRequest = async (matchId: Id<"matches">) => {
    try {
      await sendRequest({ matchId });
      toast.success('Chat request sent!');
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast.error(error?.message || 'Failed to send request');
    }
  };

  // Auto-redirect when a new chat session is created (request accepted)
  useEffect(() => {
    if (!matches || !prevMatchesRef.current) {
      prevMatchesRef.current = matches;
      return;
    }

    // Check if any match has a new active chat session
    matches.forEach((match) => {
      const prevMatch = prevMatchesRef.current?.find((m) => m._id === match._id);

      if (
        prevMatch &&
        !prevMatch.hasActiveChat &&
        match.hasActiveChat &&
        match.chatSessionId
      ) {
        // New chat session created! Redirect
        toast.success('Chat is ready!');
        navigate({
          to: '/chat/$chatId',
          params: { chatId: match.chatSessionId },
        });
      }
    });

    prevMatchesRef.current = matches;
  }, [matches, navigate]);

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    navigate({ to: '/login' });
    return null;
  }

  // Loading state
  if (!isLoaded || matches === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-black px-6 py-4 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Your Matches</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Start chatting to find your matches!
            </p>
            <Link to="/dashboard">
              <Button size="lg">Find Match</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onSendRequest={handleSendRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
