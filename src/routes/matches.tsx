import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { useEffect, useRef } from 'react';
import { MatchCard } from '@/components/matches/MatchCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const matches = useQuery(api.matches.list, {});
  const sendRequest = useMutation(api.chatRequests.send);
  const deleteMatch = useMutation(api.matches.remove);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

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

  const handleDeleteMatch = async (matchId: Id<"matches">) => {
    try {
      await deleteMatch({ matchId });
      toast.success('Match removed');
    } catch (error: any) {
      console.error('Error removing match:', error);
      toast.error(error?.message || 'Failed to remove match');
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

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-2 border-border px-6 py-6 bg-card shadow-soft-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl transition-smooth">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Your Matches</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {matches === undefined ? (
          null
        ) : matches.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="mb-8 flex justify-center">
              <span className="h-20 w-20 rounded-full border border-border flex items-center justify-center">
                <Heart className="h-10 w-10" />
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4">No matches yet</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              Start chatting with new people to build meaningful connections
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="px-16 py-7 text-lg rounded-2xl shadow-soft-lg hover-lift transition-smooth">
                Find Match
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-12 text-center fade-in space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-border">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-lg text-muted-foreground">
                {matches.length} {matches.length === 1 ? 'connection' : 'connections'} ready to explore
              </p>
            </div>

            {/* Matches grid */}
            <div className="grid gap-6 md:grid-cols-2 slide-up">
              {matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onSendRequest={handleSendRequest}
                  onDelete={handleDeleteMatch}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
