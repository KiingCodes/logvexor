import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/components/auth-provider";
import { useAuth } from "@/components/auth-context";
import { OrganisationProvider } from "@/components/organisation-provider";
import { getSignInHref, isPublicAuthPath } from "@/lib/auth-routing";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LogVexor" },
      { name: "description", content: "A clear view of your security posture." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "LogVexor" },
      { property: "og:description", content: "A clear view of your security posture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganisationProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <RouteAccessBoundary />
        </OrganisationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RouteAccessBoundary() {
  const { initializationError, initializing, user } = useAuth();
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  const isPublicRoute = isPublicAuthPath(location.pathname);
  const returnTo = `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`;
  const signInHref = getSignInHref(returnTo);

  useEffect(() => {
    if (isPublicRoute || initializing || initializationError || user) return;
    router.history.replace(signInHref);
  }, [initializationError, initializing, isPublicRoute, router, signInHref, user]);

  if (isPublicRoute || user) {
    return <Outlet />;
  }

  if (initializing) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background px-5"
      >
        <p className="text-sm text-muted-foreground">Restoring your session...</p>
      </main>
    );
  }

  if (initializationError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <section className="max-w-md rounded-md border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Unable to verify your session</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Workspace access is paused until your session can be verified. You can try
            signing in again.
          </p>
          <a
            href={signInHref}
            className="mt-5 inline-flex min-h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Go to sign in
          </a>
        </section>
      </main>
    );
  }

  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background px-5"
    >
      <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
    </main>
  );
}
