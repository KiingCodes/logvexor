import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  BookOpenCheck,
  Box,
  Bug,
  Gauge,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { LogVexorBrand } from "@/components/logvexor-brand";
import { useOrganisation } from "@/components/organisation-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { label: "Overview", to: "/", icon: Gauge },
  { label: "Assets", to: "/assets", icon: Box },
  { label: "Vulnerabilities", to: "/vulnerabilities", icon: Bug },
  { label: "Risk", to: "/risks", icon: Activity },
  { label: "Remediation", to: "/guidance", icon: BookOpenCheck },
  { label: "Settings", to: "/settings", icon: Settings2 },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
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

function AccountActions({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { initializationError, initializing, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setErrorMessage("");
    try {
      await signOut();
      onNavigate?.();
      await navigate({ to: "/sign-in" });
    } catch (error) {
      setErrorMessage(
        typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  if (initializing && !user) {
    return <p className="px-2 py-2 text-xs text-muted-foreground">Restoring session...</p>;
  }

  if (user) {
    return (
      <div className="space-y-1">
        <p
          className="truncate px-2 py-1 text-xs text-muted-foreground"
          title={user.email ?? undefined}
        >
          Signed in as {user.email ?? "LogVexor user"}
        </p>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 w-full justify-between px-2"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign out"}
          <LogOut className="size-4 text-muted-foreground" />
        </Button>
        {(errorMessage || initializationError) && (
          <p role="alert" className="px-2 py-1 text-xs text-destructive">
            {errorMessage || initializationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {(errorMessage || initializationError) && (
        <p role="alert" className="px-2 py-1 text-xs text-destructive">
          {errorMessage || initializationError}
        </p>
      )}
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
  );
}

function SidebarContents({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  const { organizations, activeOrganization, role, loading, switchActiveOrganization } =
    useOrganisation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 pb-8 pt-6">
        <LogVexorBrand />
      </div>
      <div className="px-5 pb-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Organization
        </p>
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading organizations...
          </p>
        ) : activeOrganization ? (
          <>
            {organizations.length > 1 ? (
              <select
                aria-label="Active organization"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground"
                value={activeOrganization.id}
                onChange={(event) => switchActiveOrganization(event.currentTarget.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="truncate text-sm font-medium" title={activeOrganization.name}>
                {activeOrganization.name}
              </p>
            )}
            {role && <p className="mt-1 text-xs capitalize text-muted-foreground">{role}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No organization selected</p>
        )}
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
          Security data not connected
        </div>
        <AccountActions onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const { organizations, activeOrganization, loading, error } = useOrganisation();
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                >
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
          <p
            className="mx-3 min-w-0 flex-1 truncate text-right text-sm font-medium text-foreground sm:text-left"
            title={activeOrganization?.name}
          >
            {activeOrganization?.name ?? "Organization"}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-signal" />
            <span>Security data not connected</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-8 sm:px-7 lg:px-10">
          {loading ? (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              Loading your organization...
            </p>
          ) : error ? (
            <section
              role="alert"
              className="max-w-xl rounded-md border border-destructive/25 bg-destructive/5 p-5"
            >
              <h1 className="text-base font-semibold">Organization data unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Workspace data is hidden until organization access can be verified.
              </p>
            </section>
          ) : organizations.length === 0 ? (
            <section className="max-w-xl rounded-md border border-border bg-card p-6">
              <h1 className="text-lg font-semibold">No organization yet</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create or join an organization to access organization-scoped workspace pages.
              </p>
              <Button asChild className="mt-5">
                <Link to="/onboarding">Set up an organization</Link>
              </Button>
            </section>
          ) : !activeOrganization ? (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              Select an organization to continue.
            </p>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
