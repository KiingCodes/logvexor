import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app-shell";
import { AuthContext, type AuthContextValue } from "@/components/auth-context";
import {
  OrganisationContext,
  type OrganisationContextValue,
} from "@/components/organisation-context";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  const React = await import("react");

  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children: ReactNode;
      [key: string]: unknown;
    }) => React.createElement("a", { href: to, ...props }, children),
    useNavigate: () => mocks.navigate,
    useRouterState: (options: { select: (state: { location: { pathname: string } }) => unknown }) =>
      options.select({ location: { pathname: mocks.pathname } }),
  };
});

const organizations: OrganisationContextValue["organizations"] = [
  {
    id: "org-a",
    name: "Alpha Security",
    slug: "alpha-security",
    website_url: null,
    created_at: "2026-11-20T00:00:00.000Z",
    updated_at: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "org-b",
    name: "Beta Security",
    slug: "beta-security",
    website_url: null,
    created_at: "2026-11-20T00:00:00.000Z",
    updated_at: "2026-11-20T00:00:00.000Z",
  },
];

function authValue(): AuthContextValue {
  return {
    session: null,
    user: {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-11-20T00:00:00.000Z",
    },
    initializing: false,
    initializationError: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

function organizationValue(
  overrides: Partial<OrganisationContextValue> = {},
): OrganisationContextValue {
  const activeOrganization =
    organizations.find((organization) => organization.id === "org-a") ?? null;
  return {
    organizations,
    activeOrganization,
    activeOrganizationId: activeOrganization?.id ?? null,
    role: "owner",
    loading: false,
    error: null,
    switchActiveOrganization: vi.fn(() => true),
    ...overrides,
  };
}

function renderWorkspace(organization: OrganisationContextValue = organizationValue()) {
  return render(
    <AuthContext.Provider value={authValue()}>
      <OrganisationContext.Provider value={organization}>
        <AppShell>
          <h1>Protected workspace content</h1>
        </AppShell>
      </OrganisationContext.Provider>
    </AuthContext.Provider>,
  );
}

describe("AppShell organization integration", () => {
  beforeEach(() => {
    mocks.pathname = "/";
    mocks.navigate.mockReset();
  });

  it("shows the active organization and role and switches between memberships", () => {
    const organization = organizationValue();
    const { container } = renderWorkspace(organization);

    expect(container.querySelector("header p[title='Alpha Security']")).toHaveTextContent(
      "Alpha Security",
    );
    expect(screen.getByRole("option", { name: "Alpha Security" })).toHaveProperty("selected", true);
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Protected workspace content" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Active organization" }), {
      target: { value: "org-b" },
    });

    expect(organization.switchActiveOrganization).toHaveBeenCalledWith("org-b");
  });

  it("withholds workspace content and offers setup when the user has no organizations", () => {
    renderWorkspace(
      organizationValue({
        organizations: [],
        activeOrganization: null,
        activeOrganizationId: null,
        role: null,
      }),
    );

    expect(screen.getByRole("heading", { name: "No organization yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up an organization" })).toHaveAttribute(
      "href",
      "/onboarding",
    );
    expect(
      screen.queryByRole("heading", { name: "Protected workspace content" }),
    ).not.toBeInTheDocument();
  });

  it("withholds workspace content while organizations load or access fails", () => {
    const loadingView = renderWorkspace(organizationValue({ loading: true }));
    expect(screen.getByText("Loading your organization...")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Protected workspace content" }),
    ).not.toBeInTheDocument();

    loadingView.rerender(
      <AuthContext.Provider value={authValue()}>
        <OrganisationContext.Provider
          value={organizationValue({ error: "Membership query failed." })}
        >
          <AppShell>
            <h1>Protected workspace content</h1>
          </AppShell>
        </OrganisationContext.Provider>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Membership query failed.");
    expect(
      screen.queryByRole("heading", { name: "Protected workspace content" }),
    ).not.toBeInTheDocument();
  });
});
