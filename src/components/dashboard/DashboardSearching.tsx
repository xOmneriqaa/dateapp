import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DashboardSearchingProps {
  onCancel: () => void;
}

export function DashboardSearching({ onCancel }: DashboardSearchingProps) {
  return (
    <div className="space-y-12 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold">Searching...</h1>
        <p className="text-lg text-muted-foreground">
          Looking for someone to chat with
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="hover-lift"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
