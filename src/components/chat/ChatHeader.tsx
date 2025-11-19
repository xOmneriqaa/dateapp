import { Button } from "@/components/ui/button";
import { LogOut, Clock } from "lucide-react";

interface ChatHeaderProps {
  phase: string;
  skipCount: number;
  timeRemaining: string | null;
  onLeave: () => void;
  onSkip: () => void;
}

export function ChatHeader({
  phase,
  skipCount,
  timeRemaining,
  onLeave,
  onSkip,
}: ChatHeaderProps) {
  return (
    <div className="border-b-2 border-black px-6 py-4 flex justify-between items-center bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">
          {phase === 'extended' ? 'Matched Chat' : 'Speed Dating'}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={onLeave}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      </div>
      {phase === 'speed_dating' && (
        <div className="flex items-center gap-4">
          <Button
            variant={skipCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={onSkip}
            className={`gap-2 font-bold transition-all ${
              skipCount === 1
                ? 'bg-black text-white animate-pulse'
                : skipCount === 2
                ? 'bg-green-600 text-white'
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
