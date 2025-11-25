import { Button } from "@/components/ui/button";
import { LogOut, Clock, ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  phase: string;
  skipCount: number;
  timeRemaining: string | null;
  isSkipping: boolean;
  onLeave: () => void;
  onSkip: () => void;
}

export function ChatHeader({
  phase,
  skipCount,
  timeRemaining,
  isSkipping,
  onLeave,
  onSkip,
}: ChatHeaderProps) {
  const isExtended = phase === 'extended';

  return (
    <div className="shrink-0 sticky top-0 z-50 border-b border-border px-6 py-4 flex justify-between items-center bg-card/80 backdrop-blur">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {isExtended ? 'Matched Chat' : 'Speed Dating'}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          {isExtended ? (
            <>
              <ArrowLeft className="h-4 w-4" />
              Back
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Leave
            </>
          )}
        </Button>
      </div>
      {phase === 'speed_dating' && (
        <div className="flex items-center gap-4">
          <Button
            variant={skipCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={onSkip}
            disabled={isSkipping}
            className={`gap-2 font-semibold transition-all ${
              skipCount === 1
                ? 'bg-accent text-accent-foreground animate-pulse'
                : skipCount === 2
                ? 'bg-primary text-primary-foreground'
                : ''
            }`}
          >
            Skip to Profiles ({skipCount}/2)
          </Button>
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-5 w-5" />
            <span className="font-bold">{timeRemaining}</span>
          </div>
        </div>
      )}
    </div>
  );
}
