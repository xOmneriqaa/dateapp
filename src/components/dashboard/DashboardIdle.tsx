import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";

interface DashboardIdleProps {
  username?: string | null;
  firstName?: string | null;
  isJoining: boolean;
  onFindMatch: () => void;
}

export function DashboardIdle({ username, firstName, isJoining, onFindMatch }: DashboardIdleProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-12 sm:py-16 min-h-[70vh] sm:min-h-[80vh]">
      <div className="w-full max-w-2xl fade-in">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <span className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-border bg-card">
            <HeartHandshake className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
          </span>
        </div>

        <div className="space-y-3 sm:space-y-4 text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Ready to connect
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground">
            15 minutes. Anonymous. Real conversations.
          </p>

          {username && (
            <p className="text-xs sm:text-sm text-muted-foreground/70">
              Welcome back, {username}
            </p>
          )}

          {/* CTA Button */}
          <div className="pt-4 sm:pt-6">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              onClick={onFindMatch}
              disabled={isJoining}
            >
              {isJoining ? 'Connecting...' : 'Find Match'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
