import { Button } from "@/components/ui/button";

interface ChatEndedOverlayProps {
  myDecision: boolean | null;
  onReturnToDashboard: () => void;
}

export function ChatEndedOverlay({ myDecision, onReturnToDashboard }: ChatEndedOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border shadow-modal p-5 sm:p-6 max-w-sm w-full rounded-xl">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="text-2xl sm:text-3xl">👋</div>
          <h2 className="text-lg sm:text-xl font-semibold">Chat Ended</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {myDecision === false
              ? "You chose not to continue."
              : myDecision === true
              ? "The other person chose not to continue."
              : "This chat has ended."}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            All messages deleted for privacy.
          </p>
          <Button
            onClick={onReturnToDashboard}
            className="w-full min-h-[48px]"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
