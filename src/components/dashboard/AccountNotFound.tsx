import { Button } from "@/components/ui/button";

interface AccountNotFoundProps {
  onRefresh: () => void;
  onSignOut: () => void;
}

export function AccountNotFound({ onRefresh, onSignOut }: AccountNotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
      <h1 className="text-2xl font-bold">Account Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Your account is being set up. Please wait a moment and refresh the page.
        If this persists, try signing out and signing back in.
      </p>
      <div className="flex gap-4">
        <Button onClick={onRefresh}>
          Refresh Page
        </Button>
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
