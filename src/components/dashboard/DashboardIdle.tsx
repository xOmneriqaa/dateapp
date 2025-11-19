import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DashboardIdleProps {
  username?: string | null;
  firstName?: string | null;
  isJoining: boolean;
  onFindMatch: () => void;
}

export function DashboardIdle({ username, firstName, isJoining, onFindMatch }: DashboardIdleProps) {
  return (
    <div className="space-y-12 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold">Ready, {username || firstName}?</h1>
        <p className="text-lg text-muted-foreground">
          Click below to find someone new
        </p>
      </div>

      <Button
        size="lg"
        className="px-16 py-8 text-2xl btn-3d hover-lift"
        onClick={onFindMatch}
        disabled={isJoining}
      >
        {isJoining ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Joining...
          </>
        ) : (
          'Find Match'
        )}
      </Button>
    </div>
  );
}
