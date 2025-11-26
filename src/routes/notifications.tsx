import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, ArrowLeft, Check, X, BellRing, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  // Skip query until user is signed in to prevent "Unauthenticated" errors
  const requests = useQuery(api.chatRequests.listPending, isSignedIn ? {} : "skip");
  const acceptRequest = useMutation(api.chatRequests.accept);
  const declineRequest = useMutation(api.chatRequests.decline);
  const canAccess = useRequireAuth({ isLoaded, isSignedIn, navigate });

  if (!canAccess) {
    return null;
  }

  // Loading state - simple, no spinner
  if (!isLoaded || requests === undefined) {
    return null;
  }

  const handleAccept = async (requestId: Id<"chatRequests">) => {
    try {
      const result = await acceptRequest({ requestId });
      toast.success('Chat request accepted!');
      navigate({
        to: '/chat/$chatId',
        params: { chatId: result.chatSessionId },
      });
    } catch (error: unknown) {
      console.error('Error accepting request:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept request';
      toast.error(message);
    }
  };

  const handleDecline = async (requestId: Id<"chatRequests">) => {
    try {
      await declineRequest({ requestId });
      toast.success('Chat request declined');
    } catch (error: unknown) {
      console.error('Error declining request:', error);
      const message = error instanceof Error ? error.message : 'Failed to decline request';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 bg-card">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Notifications</h1>
          {requests.length > 0 && (
            <span className="bg-foreground text-background text-xs font-medium px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {requests.length === 0 ? (
          <div className="text-center py-10 sm:py-12 fade-in">
            <div className="mb-4 sm:mb-6 flex justify-center">
              <span className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-border flex items-center justify-center bg-card">
                <BellRing className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">All caught up</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 max-w-sm mx-auto">
              Chat requests will appear here
            </p>
            <Link to="/dashboard">
              <Button size="default" className="min-h-[44px]">
                Find Match
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-5 sm:mb-6 text-center fade-in">
              <div className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border mb-2 sm:mb-3 bg-card">
                <MessageSquareText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <h2 className="text-sm sm:text-base font-medium mb-1">
                {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to chat
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Accept to continue
              </p>
            </div>

            {/* Notifications list */}
            <div className="space-y-2 sm:space-y-3 slide-up">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Profile Photo */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border overflow-hidden bg-muted flex-shrink-0">
                      {request.fromUser?.photos &&
                      request.fromUser.photos.length > 0 ? (
                        <img
                          src={request.fromUser.photos[0]}
                          alt={request.fromUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-6 w-6 sm:h-10 sm:w-10 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium mb-0.5 truncate">
                        {request.fromUser?.name || 'Anonymous'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {request.fromUser?.age
                          ? `${request.fromUser.age}`
                          : ''}
                        {request.fromUser?.gender &&
                          ` • ${
                            request.fromUser.gender.charAt(0).toUpperCase() +
                            request.fromUser.gender.slice(1)
                          }`}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1">
                        {new Date(request.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions - inline */}
                    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleAccept(request._id)}
                        size="sm"
                        className="gap-1 min-h-[36px] sm:min-h-[32px] px-2.5 sm:px-3 text-xs sm:text-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Accept</span>
                      </Button>
                      <Button
                        onClick={() => handleDecline(request._id)}
                        variant="ghost"
                        size="sm"
                        className="gap-1 min-h-[36px] sm:min-h-[32px] px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
