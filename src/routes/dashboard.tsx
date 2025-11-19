import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect, useRef } from 'react';
import { Loader2, User, Heart, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { AccountNotFound } from '@/components/dashboard/AccountNotFound';
import { DashboardIdle } from '@/components/dashboard/DashboardIdle';
import { DashboardSearching } from '@/components/dashboard/DashboardSearching';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [isJoining, setIsJoining] = useState(false);

  // Convex hooks - reactive queries automatically update
  const queueStatus = useQuery(api.queue.status);
  const joinQueue = useMutation(api.queue.join);
  const leaveQueue = useMutation(api.queue.leave);
  const pendingRequests = useQuery(api.chatRequests.listPending);
  const matches = useQuery(api.matches.list);

  // Track previous matches state to detect when a pending request becomes active
  const prevMatchesRef = useRef(matches);

  // Handler functions
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
      // Sign out with explicit redirect - this clears the Clerk session
      await signOut({ redirectUrl: window.location.origin + '/login' });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    navigate({ to: '/login' });
    return null;
  }

  // Automatically redirect when matched (reactive!)
  useEffect(() => {
    if (queueStatus?.matched && queueStatus.chatSessionId) {
      navigate({
        to: '/chat/$chatId',
        params: { chatId: queueStatus.chatSessionId },
      });
    }
  }, [queueStatus, navigate]);

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
    } catch (error: any) {
      console.error('Error joining queue:', error);
      // Show user-friendly error message
      toast.error(error?.message || 'Failed to join queue. Please try again.');
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
      <div className="absolute top-4 right-4 flex gap-2">
        <Link to="/profile">
          <Button variant="outline" size="sm" className="gap-2 shadow-3d-sm hover-lift">
            <User className="h-4 w-4" />
            Profile
          </Button>
        </Link>
        <Link to="/matches">
          <Button variant="outline" size="sm" className="gap-2 shadow-3d-sm hover-lift">
            <Heart className="h-4 w-4" />
            Matches
          </Button>
        </Link>
        <Link to="/notifications">
          <Button variant="outline" size="sm" className="gap-2 relative shadow-3d-sm hover-lift">
            <Bell className="h-4 w-4" />
            Notifications
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </Button>
        </Link>
        <Button variant="ghost" onClick={handleSignOut} className="border-none shadow-none hover:bg-transparent hover:text-destructive">
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
