import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <div className="max-w-2xl w-full text-center">
      <div className="space-y-6 mb-12">
        <h1 className="text-7xl font-bold tracking-tight">
          Speed Date
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          15 minutes. Random connections. Real conversations.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link to="/register">
          <Button
            size="lg"
            className="w-full sm:w-auto text-lg px-12 py-6 shadow-3d hover-lift"
          >
            Get Started
          </Button>
        </Link>
        <Link to="/login">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-lg px-12 py-6 shadow-3d-sm hover-lift"
          >
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
