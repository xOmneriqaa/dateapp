import { Button } from "@/components/ui/button";

interface DashboardIdleProps {
  username?: string | null;
  firstName?: string | null;
  isJoining: boolean;
  onFindMatch: () => void;
}

export function DashboardIdle({ username, firstName, isJoining, onFindMatch }: DashboardIdleProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-12">
      <div className="space-y-12 text-center w-full max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold">Ready, {username || firstName}?</h1>
          <p className="text-lg text-muted-foreground">
            Click below to find someone new
          </p>
        </div>

        <Button
          size="lg"
          className="px-16 py-8 text-2xl btn-3d hover-lift mx-auto"
          onClick={onFindMatch}
          disabled={isJoining}
        >
          Find Match
        </Button>
      </div>
    </div>
  );
}
