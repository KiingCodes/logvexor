import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/components/auth-context";
import { OrganisationProvider } from "@/components/organisation-provider";
import { useOrganisation } from "@/components/organisation-context";

const mocks = vi.hoisted(() => {
  const historyReplace = vi.fn();
  return {
    location: { pathname: "/", searchStr: "", hash: "" },
    historyReplace,
    router: { history: { replace: historyReplace } },
    from: vi.fn(),
    membershipSelect: vi.fn(),
    membershipEq: vi.fn(),
    organizationSelect: vi.fn(),
    organizationIn: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useRouter: () => mocks.router,
    useRouterState: (options: {
      select: (state: { location: typeof mocks.location }) => unknown;
    }) => options.select({ location: mocks.location }),
  };
});

const user = {
  id: "user-1",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-11-20T00:00:00.000Z",
} satisfies User;

const memberships = [
  { org_id: "org-a", role: "owner" },
  { org_id: "org-b", role: "viewer" },
];

const organizations = [
  {
    id: "org-a",
    name: "Alpha",
    slug: "alpha",
    website_url: null,
    created_at: "2026-11-20T00:00:00.000Z",
    updated_at: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "org-b",
    name: "Beta",
    slug: "beta",
    website_url: "https://beta.example",
    created_at: "2026-11-20T00:00:00.000Z",
    updated_at: "2026-11-20T00:00:00.000Z",
  },
];

function authContextValue(currentUser: User | null): AuthContextValue {
  return {
    session: null,
    user: currentUser,
    initializing: false,
    initializationError: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

function OrganisationProbe() {
  const {
    organizations: availableOrganizations,
    activeOrganizationId,
    role,
    loading,
    error,
    switchActiveOrganization,
  } = useOrganisation();

  return (
    <div>
      <output data-testid="loading">{loading ? "loading" : "ready"}</output>
      <output data-testid="active">{activeOrganizationId ?? "none"}</output>
      <output data-testid="role">{role ?? "none"}</output>
      <output data-testid="count">{availableOrganizations.length}</output>
      <output data-testid="error">{error ?? ""}</output>
      <button onClick={() => switchActiveOrganization("org-b")}>Switch to Beta</button>
    </div>
  );
}

function renderOrganisationProvider(currentUser: User | null = user) {
  return render(
    <AuthContext.Provider value={authContextValue(currentUser)}>
      <OrganisationProvider>
        <OrganisationProbe />
      </OrganisationProvider>
    </AuthContext.Provider>,
  );
}

describe("OrganisationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.location.pathname = "/";
    mocks.location.searchStr = "";
    mocks.location.hash = "";
    mocks.from.mockImplementation((table: string) =>
      table === "organization_memberships"
        ? { select: mocks.membershipSelect }
        : { select: mocks.organizationSelect },
    );
    mocks.membershipSelect.mockReturnValue({ eq: mocks.membershipEq });
    mocks.membershipEq.mockResolvedValue({ data: memberships, error: null });
    mocks.organizationSelect.mockReturnValue({ in: mocks.organizationIn });
    mocks.organizationIn.mockResolvedValue({ data: organizations, error: null });
  });

  it("restores the selected organization from the URL on refresh", async () => {
    mocks.location.searchStr = "?organizationId=org-b";
    renderOrganisationProvider();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    expect(mocks.from).toHaveBeenNthCalledWith(1, "organization_memberships");
    expect(mocks.membershipSelect).toHaveBeenCalledWith("org_id, role");
    expect(mocks.membershipEq).toHaveBeenCalledWith("user_id", user.id);
    expect(mocks.organizationIn).toHaveBeenCalledWith("id", ["org-a", "org-b"]);
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("active")).toHaveTextContent("org-b");
    expect(screen.getByTestId("role")).toHaveTextContent("viewer");
    expect(mocks.historyReplace).not.toHaveBeenCalled();
  });

  it("switches the active organization and role to another membership", async () => {
    mocks.location.pathname = "/assets";
    mocks.location.searchStr = "?tab=details&organizationId=org-a";
    mocks.location.hash = "findings";
    renderOrganisationProvider();
    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("org-a"));

    fireEvent.click(screen.getByRole("button", { name: "Switch to Beta" }));

    expect(screen.getByTestId("active")).toHaveTextContent("org-b");
    expect(screen.getByTestId("role")).toHaveTextContent("viewer");
    expect(mocks.historyReplace).toHaveBeenCalledWith(
      "/assets?tab=details&organizationId=org-b#findings",
    );
  });

  it("restores organizationId after navigation drops it while preserving other URL state", async () => {
    mocks.location.pathname = "/assets";
    mocks.location.searchStr = "?organizationId=org-b";
    const view = renderOrganisationProvider();
    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("org-b"));

    mocks.location.pathname = "/risks";
    mocks.location.searchStr = "?view=summary";
    mocks.location.hash = "trend";
    view.rerender(
      <AuthContext.Provider value={authContextValue(user)}>
        <OrganisationProvider>
          <OrganisationProbe />
        </OrganisationProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() =>
      expect(mocks.historyReplace).toHaveBeenCalledWith(
        "/risks?view=summary&organizationId=org-b#trend",
      ),
    );
    expect(screen.getByTestId("active")).toHaveTextContent("org-b");
  });

  it("handles users with no memberships without querying organizations", async () => {
    mocks.membershipEq.mockResolvedValue({ data: [], error: null });
    renderOrganisationProvider();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("active")).toHaveTextContent("none");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    expect(mocks.organizationIn).not.toHaveBeenCalled();
  });

  it("does not trust an organizationId that is not in the user's memberships", async () => {
    mocks.location.searchStr = "?organizationId=org-other";
    renderOrganisationProvider();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    expect(screen.getByTestId("active")).toHaveTextContent("org-a");
    expect(mocks.organizationIn).toHaveBeenCalledWith("id", ["org-a", "org-b"]);
    expect(mocks.historyReplace).toHaveBeenCalledWith("/?organizationId=org-a");
  });

  it("reloads memberships when the user changes and clears them on sign-out", async () => {
    const view = renderOrganisationProvider();
    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("org-a"));

    mocks.membershipEq.mockImplementation((_column: string, userId: string) =>
      Promise.resolve({
        data: userId === "user-2" ? [{ org_id: "org-b", role: "owner" }] : memberships,
        error: null,
      }),
    );
    mocks.organizationIn.mockImplementation((_column: string, organizationIds: string[]) =>
      Promise.resolve({
        data: organizations.filter((organization) => organizationIds.includes(organization.id)),
        error: null,
      }),
    );

    const secondUser = { ...user, id: "user-2" };
    view.rerender(
      <AuthContext.Provider value={authContextValue(secondUser)}>
        <OrganisationProvider>
          <OrganisationProbe />
        </OrganisationProvider>
      </AuthContext.Provider>,
    );
    await waitFor(() => {
      expect(mocks.membershipEq).toHaveBeenCalledWith("user_id", "user-2");
      expect(screen.getByTestId("role")).toHaveTextContent("owner");
    });

    view.rerender(
      <AuthContext.Provider value={authContextValue(null)}>
        <OrganisationProvider>
          <OrganisationProbe />
        </OrganisationProvider>
      </AuthContext.Provider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(screen.getByTestId("active")).toHaveTextContent("none");
    });
  });
});
