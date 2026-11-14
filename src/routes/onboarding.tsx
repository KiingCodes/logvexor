import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Globe2, ShieldCheck } from "lucide-react";

import { LogVexorBrand } from "@/components/logvexor-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [notice, setNotice] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Your organization has not been saved. Connect your Supabase project to enable workspace setup.");
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
              <Input id="organization-name" name="organizationName" placeholder="Acme, Inc." required />
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
                />
              </div>
            </div>
            <Button type="submit" className="h-10 w-full sm:w-auto">
              Create organization
            </Button>
          </form>
          <p className="mt-5 rounded-md border border-border bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            Organization setup is not connected yet. Submitting this form will not save or send your information.
          </p>
          {notice && (
            <p role="status" className="mt-3 rounded-md border border-signal/25 bg-signal-soft px-3 py-2.5 text-sm leading-5">
              {notice}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}