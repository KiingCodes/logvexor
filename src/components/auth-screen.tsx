import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { LogVexorBrand } from "@/components/logvexor-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeReturnTo } from "@/lib/auth-routing";

type AuthMode = "sign-in" | "register";

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return null;
    return getSafeReturnTo(new URLSearchParams(window.location.search).get("redirect"));
  });
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
    continueToWorkspace?: boolean;
  } | null>(null);
  const { initializationError, initializing, signIn, signUp } = useAuth();
  const registering = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (registering) {
        const fullName = String(formData.get("fullName") ?? "").trim();
        const { hasSession } = await signUp(email, password, fullName);
        setFeedback({
          kind: "success",
          message: hasSession
            ? "Your account has been created and you are signed in."
            : "Account created. Check your email to confirm your address before signing in.",
          continueToWorkspace: hasSession,
        });
      } else {
        const { hasSession } = await signIn(email, password);
        setFeedback({
          kind: "success",
          message: hasSession ? "You are signed in." : "Sign-in completed.",
          continueToWorkspace: hasSession,
        });
      }

      const passwordInput = form.elements.namedItem("password");
      if (passwordInput instanceof HTMLInputElement) passwordInput.value = "";
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Authentication failed. Please try again.";
      setFeedback({ kind: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="auth-panel-grid relative flex min-h-[280px] flex-col overflow-hidden bg-primary px-7 py-7 text-primary-foreground sm:px-10 lg:min-h-screen lg:px-12 lg:py-10">
        <LogVexorBrand inverse />
        <div className="relative z-10 my-auto max-w-[470px] py-12 lg:py-24">
          <div className="mb-8 flex size-12 items-center justify-center rounded-md border border-primary-foreground/20 bg-primary-foreground/10">
            <Fingerprint className="size-6" />
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/65">
            Security, in focus
          </p>
          <h1 className="max-w-[420px] text-3xl font-semibold leading-tight sm:text-4xl">
            Clarity across your security posture.
          </h1>
          <p className="mt-5 max-w-[390px] text-sm leading-6 text-primary-foreground/70">
            Bring your assets and security signals into one considered workspace. Your organization stays in control of its data.
          </p>
        </div>
        <div className="relative z-10 hidden items-center gap-2 text-xs text-primary-foreground/55 lg:flex">
          <ShieldCheck className="size-4" />
          LogVexor security workspace
        </div>
      </section>

      <section className="flex min-h-[580px] items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-9 lg:hidden">
            <LogVexorBrand />
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-signal">{registering ? "Get started" : "Welcome back"}</p>
            <h2 className="text-2xl font-semibold sm:text-[28px]">
              {registering ? "Create your account" : "Sign in to LogVexor"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {registering
                ? "Start with your work email. Set up your organization next."
                : "Enter your details to access your security workspace."}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {registering && (
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  disabled={submitting}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                {!registering && (
                  <span className="text-xs text-muted-foreground">
                    Password recovery is not available yet
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={registering ? "new-password" : "current-password"}
                  minLength={registering ? 10 : undefined}
                  placeholder={registering ? "At least 10 characters" : "Enter your password"}
                  className="pr-11"
                  required
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((shown) => !shown)}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="h-10 w-full" disabled={submitting || initializing}>
              {submitting
                ? registering
                  ? "Creating account..."
                  : "Signing in..."
                : registering
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            Authentication uses Supabase. If email confirmation is enabled, confirm your
            address before signing in.
          </p>
          {initializationError && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm leading-5 text-destructive"
            >
              Could not restore your session: {initializationError}
            </p>
          )}
          {feedback && (
            <p
              role={feedback.kind === "error" ? "alert" : "status"}
              className={`mt-3 rounded-md border px-3 py-2.5 text-sm leading-5 ${
                feedback.kind === "error"
                  ? "border-destructive/25 bg-destructive/5 text-destructive"
                  : "border-signal/25 bg-signal-soft text-foreground"
              }`}
            >
              {feedback.message}
            </p>
          )}
          {feedback?.continueToWorkspace && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => router.history.push(returnTo ?? "/")}
            >
              {returnTo ? "Continue to requested page" : "Continue to workspace"}
            </Button>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {registering ? "Already have an account? " : "New to LogVexor? "}
            <Link
              to={registering ? "/sign-in" : "/register"}
              className="font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-signal"
            >
              {registering ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}