import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BookOpenCheck,
  Box,
  Bug,
  Gauge,
  Menu,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { LogVexorBrand } from "@/components/logvexor-brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { label: "Overview", to: "/", icon: Gauge },
  { label: "Assets", to: "/assets", icon: Box },
  { label: "Vulnerabilities", to: "/vulnerabilities", icon: Bug },
  { label: "Risk", to: "/risks", icon: Activity },
  { label: "Remediation", to: "/guidance", icon: BookOpenCheck },
  { label: "Settings", to: "/settings", icon: Settings2 },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: (() => void) | undefined }) {
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigation.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContents({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 pb-8 pt-6">
        <LogVexorBrand />
      </div>
      <div className="px-3">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Workspace
        </p>
        <NavLinks pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="mt-auto border-t border-border px-4 py-4">
        <div className="mb-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-signal" />
          No data source connected
        </div>
        <Link
          to="/sign-in"
          onClick={onNavigate}
          className="flex min-h-9 items-center justify-between rounded-md px-2 text-sm text-foreground transition-colors hover:bg-accent"
        >
          Sign in <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/register"
          onClick={onNavigate}
          className="flex min-h-9 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] border-r border-border bg-sidebar md:block">
        <SidebarContents pathname={pathname} />
      </aside>
      <div className="min-h-screen md:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 sm:max-w-[280px]">
                <SheetTitle className="sr-only">LogVexor navigation</SheetTitle>
                <SidebarContents pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <ShieldCheck className="size-4" />
              Security workspace
            </div>
            <span className="text-sm font-medium sm:hidden">LogVexor</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-signal" />
            <span>Not connected</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-8 sm:px-7 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}