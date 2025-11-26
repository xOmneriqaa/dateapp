import { Button } from "@/components/ui/button";
import { Heart, X, Undo2 } from "lucide-react";

interface DecisionOverlayProps {
  myDecision: boolean | null;
  isDeciding: boolean;
  onDecision: (wantsToContinue: boolean) => void;
  onCancel?: () => void;
  isCanceling?: boolean;
  timeoutSeconds?: number; // Seconds remaining until timeout
}

export function DecisionOverlay({
  myDecision,
  isDeciding,
  onDecision,
  onCancel,
  isCanceling,
  timeoutSeconds,
}: DecisionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border shadow-modal p-5 sm:p-6 max-w-sm w-full rounded-xl">
        <h2 className="text-lg sm:text-xl font-semibold text-center mb-3 sm:mb-4">
          Time's Up
        </h2>
        <p className="text-center text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">
          Do you want to continue chatting and see this person's profile?
        </p>

        {myDecision === null ? (
          <div className="flex gap-3">
            <Button
              onClick={() => onDecision(false)}
              variant="outline"
              className="flex-1 gap-2 min-h-[48px] text-sm"
              disabled={isDeciding}
            >
              <X className="h-4 w-4" />
              No Thanks
            </Button>
            <Button
              onClick={() => onDecision(true)}
              className="flex-1 gap-2 min-h-[48px] text-sm"
              disabled={isDeciding}
            >
              <Heart className="h-4 w-4" />
              Continue
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm sm:text-base font-medium mb-1">
              {myDecision ? 'You said Yes' : 'You said No'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Waiting for the other person...
            </p>

            {/* Timeout countdown */}
            {timeoutSeconds !== undefined && timeoutSeconds > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Timing out in {timeoutSeconds}s
              </p>
            )}

            <div className="mt-4">
              <div className="animate-pulse text-2xl">⏳</div>
            </div>

            {/* Cancel/change decision button - only show if user said Yes */}
            {myDecision && onCancel && (
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="mt-5 sm:mt-6 gap-2 text-muted-foreground hover:text-foreground min-h-[44px]"
                disabled={isCanceling}
              >
                <Undo2 className="h-4 w-4" />
                {isCanceling ? 'Canceling...' : 'Change my mind'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
