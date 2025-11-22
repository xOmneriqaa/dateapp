import { Button } from "@/components/ui/button";
import { DotMatrixConnection } from "@/components/ui/ascii-art";

interface DashboardSearchingProps {
  onCancel: () => void;
}

export function DashboardSearching({ onCancel }: DashboardSearchingProps) {
  return (
    <div className="flex w-full items-center justify-center px-4 py-16 min-h-[80vh]">
      <div className="w-full max-w-5xl slide-up">
        {/* Large animated ASCII art - NO spinner, just smooth pulse */}
        <div className="mb-16 relative">
          <div className="animate-pulse">
            <DotMatrixConnection size="lg" className="mb-8" />
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-8 text-center max-w-3xl mx-auto">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-foreground">
            Finding your match
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            We're connecting you with someone new
          </p>

          {/* Subtle status indicator - NOT a loading bar */}
          <div className="flex justify-center gap-2 py-4">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Cancel button */}
          <div className="pt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="px-16 py-6 text-lg font-medium rounded-2xl shadow-soft hover-lift transition-smooth border-2 border-border"
            >
              Cancel Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
