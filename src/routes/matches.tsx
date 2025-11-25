import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { ChatListCard } from '@/components/matches/ChatListCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export const Route = createFileRoute('/matches')({
  component: ChatsPage,
});

function ChatsPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  // Skip query until user is signed in to prevent "Unauthenticated" errors
  const matches = useQuery(api.matches.list, isSignedIn ? {} : "skip");
  const cutConnection = useMutation(api.matches.cutConnection);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  const handleCutConnection = async (matchId: Id<"matches">) => {
    try {
      await cutConnection({ matchId });
      toast.success('Chat ended');
    } catch (error: unknown) {
      console.error('Error cutting connection:', error);
      const message = error instanceof Error ? error.message : 'Failed to end chat';
      toast.error(message);
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-2 border-border px-4 sm:px-6 py-4 sm:py-6 bg-card shadow-soft-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl transition-smooth">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Chats</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {matches === undefined ? (
          null
        ) : matches.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="mb-8 flex justify-center">
              <span className="h-20 w-20 rounded-full border border-border flex items-center justify-center">
                <MessageCircle className="h-10 w-10" />
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4">No chats yet</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              Start speed dating to make connections and build lasting conversations
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="px-16 py-7 text-lg rounded-2xl shadow-soft-lg hover-lift transition-smooth">
                Find Someone
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 slide-up">
            {matches.map((match) => (
              <ChatListCard
                key={match._id}
                match={match}
                onCutConnection={handleCutConnection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
