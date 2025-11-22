import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, ArrowLeft, Check, X, BellRing, MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const requests = useQuery(api.chatRequests.listPending);
  const acceptRequest = useMutation(api.chatRequests.accept);
  const declineRequest = useMutation(api.chatRequests.decline);

  // Redirect to login if not authenticated
  if (isLoaded && !isSignedIn) {
    navigate({ to: '/login' });
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
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error?.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId: Id<"chatRequests">) => {
    try {
      await declineRequest({ requestId });
      toast.success('Chat request declined');
    } catch (error: any) {
      console.error('Error declining request:', error);
      toast.error(error?.message || 'Failed to decline request');
    }
  };

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
          <h1 className="text-3xl font-bold">Notifications</h1>
          {requests.length > 0 && (
            <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {requests.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="mb-8 flex justify-center">
              <span className="h-20 w-20 rounded-full border border-border flex items-center justify-center">
                <BellRing className="h-10 w-10" />
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4">All caught up</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              Chat requests from your matches will appear here
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="px-16 py-7 text-lg rounded-2xl shadow-soft-lg hover-lift transition-smooth">
                Find Match
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-12 text-center fade-in">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-border mb-6">
                <MessageSquareText className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to chat again
              </h2>
              <p className="text-muted-foreground">
                Accept to continue the conversation
              </p>
            </div>

            {/* Notifications list */}
            <div className="space-y-6 slide-up">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-card border-2 border-border rounded-2xl shadow-soft p-6 transition-smooth hover:shadow-soft-lg"
                >
                  <div className="flex items-start gap-6">
                    {/* Profile Photo */}
                    <div className="w-20 h-20 rounded-full border-4 border-border overflow-hidden bg-muted flex-shrink-0 shadow-soft-sm">
                      {request.fromUser?.photos &&
                      request.fromUser.photos.length > 0 ? (
                        <img
                          src={request.fromUser.photos[0]}
                          alt={request.fromUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold mb-2">
                        {request.fromUser?.name || 'Anonymous'}
                      </h3>
                      <p className="text-base text-muted-foreground mb-3">
                        {request.fromUser?.age
                          ? `${request.fromUser.age} years old`
                          : 'Age not set'}
                        {request.fromUser?.gender &&
                          ` • ${
                            request.fromUser.gender.charAt(0).toUpperCase() +
                            request.fromUser.gender.slice(1)
                          }`}
                      </p>
                      <p className="text-base mb-3 text-foreground">
                        Wants to chat with you again!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t-2 border-border">
                    <Button
                      onClick={() => handleAccept(request._id)}
                      size="lg"
                      className="flex-1 gap-2 rounded-xl transition-smooth"
                    >
                      <Check className="h-5 w-5" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDecline(request._id)}
                      variant="outline"
                      size="lg"
                      className="flex-1 gap-2 rounded-xl transition-smooth"
                    >
                      <X className="h-5 w-5" />
                      Decline
                    </Button>
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
