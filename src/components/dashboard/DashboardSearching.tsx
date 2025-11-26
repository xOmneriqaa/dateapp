import { Button } from "@/components/ui/button";
import { Radar } from "lucide-react";

interface DashboardSearchingProps {
  onCancel: () => void;
}

export function DashboardSearching({ onCancel }: DashboardSearchingProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-12 sm:py-16 min-h-[70vh] sm:min-h-[80vh]">
      <div className="w-full max-w-2xl slide-up">
        <div className="mb-6 sm:mb-8 flex justify-center">
          <span className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-border bg-card animate-pulse">
            <Radar className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
          </span>
        </div>

        <div className="space-y-3 sm:space-y-4 text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Finding your match
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground">
            Connecting you with someone new
          </p>

          {/* Subtle status indicator */}
          <div className="flex justify-center gap-1.5 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Cancel button */}
          <div className="pt-3 sm:pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="min-h-[44px] px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
