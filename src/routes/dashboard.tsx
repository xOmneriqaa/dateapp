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
  // Skip queries until user is signed in to prevent "Unauthenticated" errors
  const queueStatus = useQuery(api.queue.status, isSignedIn ? {} : "skip");
  const joinQueue = useMutation(api.queue.join);
  const leaveQueue = useMutation(api.queue.leave);
  const pendingRequests = useQuery(api.chatRequests.listPending, isSignedIn ? {} : "skip");
  const chats = useQuery(api.matches.list, isSignedIn ? {} : "skip");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20 sm:pb-4">
      {/* Navigation - Mobile: fixed bottom bar, Desktop: top right */}
      <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:top-4 sm:left-auto sm:right-4
                      bg-background/80 backdrop-blur sm:bg-transparent sm:backdrop-blur-none
                      border-t sm:border-none border-border
                      flex items-center justify-around sm:justify-end gap-1 sm:gap-2 p-2 sm:p-0 z-50">
        <Link to="/profile">
          <Button variant="ghost" size="sm" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-2 px-3 sm:py-2 sm:px-3 sm:border sm:border-border">
            <User className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Profile</span>
          </Button>
        </Link>
        <Link to="/matches">
          <Button variant="ghost" size="sm" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-2 px-3 sm:py-2 sm:px-3 relative sm:border sm:border-border">
            <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Chats</span>
            {chats && chats.length > 0 && (
              <span className="absolute top-0 right-1 sm:-top-1 sm:-right-1 bg-foreground text-background text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium text-[10px] sm:text-xs">
                {chats.length}
              </span>
            )}
          </Button>
        </Link>
        <Link to="/notifications">
          <Button variant="ghost" size="sm" className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-2 px-3 sm:py-2 sm:px-3 relative sm:border sm:border-border">
            <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm hidden sm:inline">Notifications</span>
            <span className="text-xs sm:hidden">Alerts</span>
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="absolute top-0 right-1 sm:-top-1 sm:-right-1 bg-foreground text-background text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium text-[10px] sm:text-xs">
                {pendingRequests.length}
              </span>
            )}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="flex-col sm:flex-row gap-1 sm:gap-2 h-auto py-2 px-3 sm:py-2 sm:px-3 sm:border sm:border-border"
        >
          <span className="text-xs sm:text-sm">Sign out</span>
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
