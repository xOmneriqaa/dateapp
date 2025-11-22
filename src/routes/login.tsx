import { createFileRoute } from '@tanstack/react-router';
import { SignIn } from '@clerk/tanstack-react-start';
import { LockIcon, MinimalHeart } from '@/components/ui/ascii-art';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Editorial content with ASCII art */}
          <div className="hidden lg:block space-y-12 fade-in">
            {/* Large ASCII art */}
            <div className="mb-8">
              <MinimalHeart size="lg" />
            </div>

            {/* Editorial text */}
            <div className="space-y-6 max-w-md">
              <h1 className="text-6xl font-bold tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-2xl text-muted-foreground font-light tracking-wide">
                Continue your journey to meaningful connections
              </p>
            </div>

            {/* Security badge with ASCII */}
            <div className="flex items-start gap-4 p-6 bg-card rounded-2xl shadow-soft-sm">
              <LockIcon size="sm" />
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversations are anonymous until you both match
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="w-full flex justify-center slide-up">
            <div className="w-full max-w-md">
              <SignIn
                routing="hash"
                signUpUrl="/register"
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
