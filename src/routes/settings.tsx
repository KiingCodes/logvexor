import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Database, Fingerprint, PlugZap, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | LogVexor" },
      { name: "description", content: "Manage LogVexor workspace and data connection settings." },
      { property: "og:title", content: "Settings | LogVexor" },
      { property: "og:description", content: "LogVexor workspace settings and connection status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-signal">Workspace</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Organization and platform connection status.</p>
      </div>

      <div className="max-w-3xl divide-y divide-border border-y border-border">
        <section className="grid gap-4 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Fingerprint className="size-4" /> Authentication</h2>
            <p className="mt-1 text-xs text-muted-foreground">Account access</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Email and password sign-in and registration use the configured Supabase project.
              Profile storage is not implemented yet.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/sign-in">Open sign-in <ArrowUpRight className="size-4" /></a>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Database className="size-4" /> Data connection</h2>
            <p className="mt-1 text-xs text-muted-foreground">External project</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal-soft px-2.5 py-1 text-xs font-medium text-signal">
              <span className="size-1.5 rounded-full bg-signal" /> Not connected
            </span>
            <p className="text-sm leading-6 text-muted-foreground">
              Authentication is connected to Supabase. Asset, scan, finding, and risk data
              are not yet connected to the database.
            </p>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-positive" />
              No scans, asset discovery, security findings, or risk scores are generated in this foundation.
            </p>
          </div>
        </section>

        <section className="grid gap-4 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><PlugZap className="size-4" /> Organization</h2>
            <p className="mt-1 text-xs text-muted-foreground">Workspace details</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Set up your organization workspace. It will not be saved until a data connection is active.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/onboarding">Open organization setup <ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}