import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { User, MessageCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { AccountNotFound } from '@/components/dashboard/AccountNotFound';
import { DashboardIdle } from '@/components/dashboard/DashboardIdle';
import { DashboardSearching } from '@/components/dashboard/DashboardSearching';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [isJoining, setIsJoining] = useState(false);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  // Convex hooks - reactive queries automatically update
  const queueStatus = useQuery(api.queue.status);
  const joinQueue = useMutation(api.queue.join);
  const leaveQueue = useMutation(api.queue.leave);
  const pendingRequests = useQuery(api.chatRequests.listPending);
  const chats = useQuery(api.matches.list, {});
  const isLoadingState = !isLoaded;

  const handleCancelSearch = async () => {
    try {
      await leaveQueue({});
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Leave queue if searching
      if (queueStatus?.inQueue) {
        await handleCancelSearch();
      }
      // Sign out WITHOUT redirectUrl - this forces complete session clearing
      // Navigate manually after sign-out completes to ensure clean state
      await signOut();
      // After sign-out completes, navigate to home page
      navigate({ to: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Automatically redirect when matched (reactive!)
  useEffect(() => {
    if (queueStatus?.matched && queueStatus.chatSessionId) {
      navigate({
        to: '/chat/$chatId',
        params: { chatId: queueStatus.chatSessionId },
      });
    }
  }, [queueStatus, navigate]);

  if (!canAccess) {
    return null;
  }

  if (isLoadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Preparing
          </p>
          <h2 className="text-2xl font-semibold">Loading your dashboard…</h2>
          <div className="flex justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    );
  }

  const handleFindMatch = async () => {
    setIsJoining(true);
    try {
      const result = await joinQueue({});

      if (result.matched && result.chatSessionId) {
        // Immediately matched
        navigate({
          to: '/chat/$chatId',
          params: { chatId: result.chatSessionId },
        });
      }
      // If not matched, user is added to queue and queueStatus query will update automatically
    } catch (error: unknown) {
      console.error('Error joining queue:', error);
      // Show user-friendly error message
      const message = error instanceof Error ? error.message : 'Failed to join queue. Please try again.';
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  // If user doesn't exist in Convex, show error (user was deleted or webhook hasn't fired yet)
  if (queueStatus && !queueStatus.userExists) {
    return (
      <AccountNotFound 
        onRefresh={() => window.location.reload()} 
        onSignOut={handleSignOut} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2 justify-end">
        <Link to="/profile">
          <Button variant="outline" size="sm" className="gap-2 shadow-soft-sm hover:shadow-soft">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
        <Link to="/matches">
          <Button variant="outline" size="sm" className="gap-2 relative shadow-soft-sm hover:shadow-soft">
            <MessageCircle className="h-4 w-4" />
            Chats
            {chats && chats.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {chats.length}
              </span>
            )}
          </Button>
        </Link>
        <Link to="/notifications">
          <Button variant="outline" size="sm" className="gap-2 relative shadow-soft-sm hover:shadow-soft">
            <Bell className="h-4 w-4" />
            Notifications
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="gap-2 shadow-soft-sm hover:shadow-soft"
        >
          Sign out
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Default to Idle if undefined or if explicitly not in queue/matched */}
        {(!queueStatus || (!queueStatus.inQueue && !queueStatus.matched)) && (
          <DashboardIdle 
            username={user?.username} 
            firstName={user?.firstName} 
            isJoining={isJoining} 
            onFindMatch={handleFindMatch} 
          />
        )}

        {queueStatus?.inQueue && !queueStatus.matched && (
          <DashboardSearching onCancel={handleCancelSearch} />
        )}
      </div>
    </div>
  );
}
