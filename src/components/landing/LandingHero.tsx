import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function LandingHero() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center px-6 py-20">
        <div className="inline-flex items-center gap-3 px-5 py-2 border border-border rounded-full uppercase text-xs tracking-[0.3em] text-muted-foreground mb-10">
          <Sparkles className="h-4 w-4" />
          Speed dating reimagined
        </div>

        <div className="space-y-8 mb-16">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tight text-foreground leading-none">
            Speed Date
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-light tracking-wide max-w-2xl mx-auto">
            15 minutes. Random connections. Real conversations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-xl font-medium px-16 py-7 rounded-2xl shadow-soft-lg hover-lift transition-smooth"
            >
              Get Started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-xl font-medium px-16 py-7 rounded-2xl shadow-soft hover-lift transition-smooth border-2 border-border"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="space-y-2 fade-in">
            <h3 className="text-lg font-semibold text-foreground">Anonymous</h3>
            <p className="text-sm text-muted-foreground">
              No profiles until you both match
            </p>
          </div>
          <div className="space-y-2 fade-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold text-foreground">Timed</h3>
            <p className="text-sm text-muted-foreground">
              15 minutes to see if there's chemistry
            </p>
          </div>
          <div className="space-y-2 fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-foreground">Real</h3>
            <p className="text-sm text-muted-foreground">
              Genuine conversations, no swiping
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
