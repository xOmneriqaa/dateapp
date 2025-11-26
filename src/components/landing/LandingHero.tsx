import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Speed Date
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            15 minutes. Random connections. Real conversations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 min-h-[48px]"
            >
              Get Started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 min-h-[48px]"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-10 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Anonymous</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              No profiles until match
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Timed</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              15 min to find chemistry
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">Real</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Real talk, no swiping
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
