import { createFileRoute } from '@tanstack/react-router';
import { SignUp } from '@clerk/tanstack-react-start';
import { DotMatrixHeart, CheckmarkIcon } from '@/components/ui/ascii-art';

export const Route = createFileRoute('/register')({
  component: Register,
});

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Editorial content with ASCII art */}
          <div className="hidden lg:block space-y-12 fade-in">
            {/* Large ASCII art */}
            <div className="mb-8">
              <DotMatrixHeart size="lg" />
            </div>

            {/* Editorial text */}
            <div className="space-y-6 max-w-md">
              <h1 className="text-6xl font-bold tracking-tight leading-tight">
                Start connecting
              </h1>
              <p className="text-2xl text-muted-foreground font-light tracking-wide">
                15-minute conversations with real people
              </p>
            </div>

            {/* Features list with ASCII checkmarks */}
            <div className="space-y-4">
              {[
                'Anonymous until you both match',
                'Timed conversations for focused connection',
                'Real conversations, no endless swiping'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <CheckmarkIcon size="sm" />
                  <p className="text-lg text-foreground pt-1">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Sign up form */}
          <div className="w-full flex justify-center slide-up">
            <div className="w-full max-w-md">
              <SignUp
                routing="hash"
                signInUrl="/login"
                fallbackRedirectUrl="/dashboard"
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-soft-lg rounded-2xl border-0 bg-card",
                    headerTitle: "text-3xl font-bold",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton: "rounded-xl border-2 border-border shadow-soft-sm hover:shadow-soft transition-smooth",
                    formButtonPrimary: "rounded-xl shadow-soft hover:shadow-soft-lg transition-smooth",
                    formFieldInput: "rounded-xl border-2 border-border",
                    footerActionLink: "text-primary hover:text-primary/80",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
