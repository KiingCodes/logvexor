import { useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Building2, Globe2, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { LogVexorBrand } from "@/components/logvexor-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization } from "@/lib/organization-onboarding";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Organization setup | LogVexor" },
      { name: "description", content: "Prepare your organization workspace in LogVexor." },
      { property: "og:title", content: "Organization setup | LogVexor" },
      { property: "og:description", content: "Set up your organization's LogVexor workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const submissionInProgress = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;

    setErrorMessage("");
    if (!user) {
      setErrorMessage("Sign in before creating an organization.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const organizationName = String(formData.get("organizationName") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim() || null;

    if (!organizationName) {
      setErrorMessage("Enter an organization name.");
      return;
    }

    submissionInProgress.current = true;
    setSubmitting(true);
    try {
      const organizationId = await createOrganization(organizationName, website);
      router.history.push(`/?organizationId=${encodeURIComponent(organizationId)}`);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? error.code
          : undefined;
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Please try again.";
      setErrorMessage(
        code === "23505"
          ? "An organization with that name may already exist. Try a different name."
          : `Could not create the organization. ${message}`,
      );
    } finally {
      submissionInProgress.current = false;
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-8">
        <LogVexorBrand />
        <Button asChild variant="ghost" size="sm">
          <Link to="/sign-in">Already have an account?</Link>
        </Button>
      </header>
      <div className="mx-auto grid w-full max-w-[1080px] gap-12 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <section className="max-w-md">
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-8 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="size-4" /> Back to overview
            </Link>
          </Button>
          <div className="mb-6 grid size-11 place-items-center rounded-md bg-signal-soft text-signal">
            <Building2 className="size-5" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-signal">Workspace setup</p>
          <h1 className="text-3xl font-semibold leading-tight">Start with your organization.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Give your security team a dedicated place to connect and review its security posture.
          </p>
          <div className="mt-8 flex gap-3 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-positive" />
            Organization details stay private to your workspace once storage is connected.
          </div>
        </section>

        <section className="max-w-xl border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <h2 className="text-xl font-semibold">Organization details</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can update these details later.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Organization name</Label>
              <Input
                id="organization-name"
                name="organizationName"
                placeholder="Acme, Inc."
                maxLength={120}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization-website">Company website</Label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="organization-website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  className="pl-9"
                  disabled={submitting}
                />
              </div>
            </div>
            <Button type="submit" className="h-10 w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Creating organization..." : "Create organization"}
            </Button>
          </form>
          <p className="mt-5 rounded-md border border-border bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            Your organization details will be saved to your LogVexor workspace.
          </p>
          {errorMessage && (
            <p role="alert" className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm leading-5 text-destructive">
              {errorMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}