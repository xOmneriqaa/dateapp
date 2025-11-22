import { Button } from "@/components/ui/button";

interface ChatEndedOverlayProps {
  myDecision: boolean | null;
  onReturnToDashboard: () => void;
}

export function ChatEndedOverlay({ myDecision, onReturnToDashboard }: ChatEndedOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-card border border-border shadow-soft-lg p-8 max-w-md w-full mx-4 rounded-3xl">
        <div className="text-center space-y-6">
          <div className="text-6xl">👋</div>
          <h2 className="text-3xl font-bold">Chat Has Ended</h2>
          <p className="text-lg text-muted-foreground">
            {myDecision === false
              ? "You chose not to continue this chat."
              : myDecision === true
              ? "The other person chose not to continue."
              : "This chat has ended."}
          </p>
          <p className="text-sm text-muted-foreground">
            All messages have been deleted for privacy.
          </p>
          <Button
            size="lg"
            onClick={onReturnToDashboard}
            className="w-full py-6 text-lg"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
