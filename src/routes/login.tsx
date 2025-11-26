import { createFileRoute } from '@tanstack/react-router';
import { SignIn } from '@clerk/tanstack-react-start';
import { dark } from '@clerk/themes';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <SignIn
          routing="hash"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "w-full mx-auto",
              card: "shadow-none border-0 bg-transparent p-0 w-full",
              headerTitle: "text-xl font-semibold text-center",
              headerSubtitle: "text-muted-foreground text-center text-sm",
              socialButtonsBlockButton: "rounded-lg border border-border hover:bg-muted transition-colors w-full",
              formButtonPrimary: "rounded-lg transition-colors w-full",
              formFieldInput: "rounded-lg border border-border w-full",
              footerActionLink: "text-foreground hover:text-foreground/80",
            }
          }}
        />
      </div>
    </div>
  );
}
