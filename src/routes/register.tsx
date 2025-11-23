import { createFileRoute } from '@tanstack/react-router';
import { SignUp } from '@clerk/tanstack-react-start';
import { dark } from '@clerk/themes';

export const Route = createFileRoute('/register')({
  component: Register,
});

function Register() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "w-full mx-auto",
              card: "shadow-none border-0 bg-transparent p-0 w-full",
              headerTitle: "text-3xl font-bold text-center",
              headerSubtitle: "text-muted-foreground text-center",
              socialButtonsBlockButton: "rounded-xl border border-border shadow-soft-sm hover:shadow-soft transition-smooth w-full",
              formButtonPrimary: "rounded-xl shadow-soft hover:shadow-soft-lg transition-smooth w-full",
              formFieldInput: "rounded-xl border border-border w-full",
              footerActionLink: "text-primary hover:text-primary/80",
            }
          }}
        />
      </div>
    </div>
  );
}
