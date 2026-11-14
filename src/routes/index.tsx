import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Box, Bug, CircleDot, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview | LogVexor" },
      { name: "description", content: "Your LogVexor security posture overview and workspace setup." },
      { property: "og:title", content: "Overview | LogVexor" },
      { property: "og:description", content: "A clear view of your organization's security workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OverviewPage,
});

const overviewTiles = [
  { label: "Connected assets", icon: Box },
  { label: "Vulnerabilities", icon: Bug },
  { label: "Risk exposure", icon: ShieldAlert },
  { label: "Recent activity", icon: Activity },
] as const;

function OverviewPage() {
  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-signal">Security posture</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Overview</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Security signals from your connected environments.
          </p>
        </div>
        <Button asChild>
          <Link to="/onboarding">Set up workspace <ArrowRight className="size-4" /></Link>
        </Button>
      </div>

      <section aria-label="Security summary" className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {overviewTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="min-h-[136px] bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{tile.label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-5 text-sm font-medium text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">Available after setup</p>
            </div>
          );
        })}
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
        <section className="min-h-[290px] border-t border-border pt-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Security activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">Recent events across your organization</p>
            </div>
            <span className="rounded-full border border-signal/20 bg-signal-soft px-2.5 py-1 text-[11px] font-medium text-signal">
              Not connected
            </span>
          </div>
          <div className="workspace-grid flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-border bg-card/70 px-5 text-center">
            <div className="max-w-sm">
              <CircleDot className="mx-auto mb-3 size-5 text-muted-foreground" />
              <p className="text-sm font-medium">No security data is connected</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Activity will appear here once your workspace is connected. No scans have been run.
              </p>
            </div>
          </div>
        </section>

        <section className="min-h-[290px] border-t border-border pt-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Get started</h2>
            <p className="mt-1 text-xs text-muted-foreground">Prepare your security workspace</p>
          </div>
          <div className="flex min-h-[210px] flex-col justify-between rounded-md border border-border bg-card p-5">
            <div>
              <div className="mb-4 grid size-10 place-items-center rounded-md bg-signal-soft text-signal">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="text-sm font-semibold">Connect your organization</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Set up your workspace to prepare LogVexor for your organization's security data.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-5 w-full justify-between">
              <Link to="/settings">Review connection settings <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
