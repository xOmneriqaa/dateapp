import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

interface DecisionOverlayProps {
  myDecision: boolean | null;
  onDecision: (wantsToContinue: boolean) => void;
}

export function DecisionOverlay({ myDecision, onDecision }: DecisionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black shadow-3d-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-6">
          Time's Up!
        </h2>
        <p className="text-center text-lg mb-8">
          Do you want to continue chatting and see this person's profile?
        </p>

        {myDecision === null ? (
          <div className="flex gap-4">
            <Button
              onClick={() => onDecision(false)}
              variant="outline"
              className="flex-1 gap-2 py-6 text-lg"
            >
              <X className="h-6 w-6" />
              No Thanks
            </Button>
            <Button
              onClick={() => onDecision(true)}
              className="flex-1 gap-2 py-6 text-lg bg-black text-white hover:bg-black/90"
            >
              <Heart className="h-6 w-6" />
              Yes, Continue
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold mb-2">
              {myDecision ? 'You said Yes!' : 'You said No'}
            </p>
            <p className="text-muted-foreground">
              Waiting for the other person to decide...
            </p>
            <div className="mt-6">
              <div className="animate-pulse text-4xl">⏳</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
