import { Button } from "@/components/ui/button";
import { DotMatrixHeart } from "@/components/ui/ascii-art";

interface DashboardIdleProps {
  username?: string | null;
  firstName?: string | null;
  isJoining: boolean;
  onFindMatch: () => void;
}

export function DashboardIdle({ username, firstName, isJoining, onFindMatch }: DashboardIdleProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-16 min-h-[80vh]">
      <div className="w-full max-w-5xl fade-in">
        {/* Large ASCII art as hero element */}
        <div className="mb-16 relative">
          <DotMatrixHeart size="lg" className="mb-8" />
        </div>

        {/* Content section with editorial layout */}
        <div className="space-y-8 text-center max-w-3xl mx-auto">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-foreground">
            Ready to connect
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            15 minutes. Anonymous. Real conversations.
          </p>

          {username && (
            <p className="text-lg text-muted-foreground/70">
              Welcome back, {username}
            </p>
          )}

          {/* CTA Button */}
          <div className="pt-8">
            <Button
              size="lg"
              className="px-20 py-8 text-xl font-medium rounded-2xl shadow-soft-lg hover-lift transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
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
