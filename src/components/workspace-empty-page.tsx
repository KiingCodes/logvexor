import type { LucideIcon } from "lucide-react";
import { ArrowRight, CircleDot } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export function WorkspaceEmptyPage({
  title,
  description,
  section,
  emptyTitle,
  emptyDescription,
  icon: Icon,
}: {
  title: string;
  description: string;
  section: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
}) {
  return (
    <AppShell>
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-signal">{section}</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <section className="workspace-grid relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-md border border-border bg-card px-5 py-12 text-center sm:min-h-[420px]">
        <div className="absolute inset-0 bg-background/65" />
        <div className="relative z-[1] flex max-w-md flex-col items-center">
          <div className="mb-5 grid size-12 place-items-center rounded-md border border-border bg-background text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal-soft px-2.5 py-1 text-[11px] font-semibold text-signal">
            <CircleDot className="size-3" /> Awaiting connection
          </div>
          <h2 className="text-lg font-semibold">{emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/settings">
              View connection settings <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}