import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

import { useAuth } from "@/components/auth-context";
import {
  OrganisationContext,
  type OrganisationContextValue,
  type OrganisationMembership,
} from "@/components/organisation-context";
import { supabase } from "@/integrations/supabase/client";

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Could not load your organizations. Please try again.";
}

function getOrganizationUrl(
  pathname: string,
  searchStr: string,
  hash: string,
  organizationId: string | null,
): string {
  const search = new URLSearchParams(searchStr);
  if (organizationId) search.set("organizationId", organizationId);
  else search.delete("organizationId");

  const query = search.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const { initializing: authInitializing, user } = useAuth();
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  const requestedOrganizationId = new URLSearchParams(location.searchStr).get("organizationId");
  const [memberships, setMemberships] = useState<OrganisationMembership[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrganizationIdRef = useRef<string | null>(null);
  const userId = user?.id ?? null;
  activeOrganizationIdRef.current = activeOrganizationId;

  const updateOrganizationUrl = useCallback(
    (organizationId: string | null): void => {
      const nextUrl = getOrganizationUrl(
        location.pathname,
        location.searchStr,
        location.hash,
        organizationId,
      );
      const currentUrl = `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ""}`;
      if (nextUrl !== currentUrl) router.history.replace(nextUrl);
    },
    [location.hash, location.pathname, location.searchStr, router],
  );

  useEffect(() => {
    let cancelled = false;

    if (authInitializing) {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    if (!userId) {
      setMemberships([]);
      setLoadedUserId(null);
      setActiveOrganizationId(null);
      setError(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);
    const authenticatedUserId = userId;

    async function loadMemberships(): Promise<void> {
      const { data: membershipRows, error: membershipError } = await supabase
        .from("organization_memberships")
        .select("org_id, role")
        .eq("user_id", authenticatedUserId);

      if (membershipError) throw membershipError;

      const rows = membershipRows ?? [];
      if (rows.length === 0) {
        if (cancelled) return;
        setMemberships([]);
        setLoadedUserId(authenticatedUserId);
        setActiveOrganizationId(null);
        updateOrganizationUrl(null);
        return;
      }

      const organizationIds = rows.map((membership) => membership.org_id);
      const { data: organizationRows, error: organizationError } = await supabase
        .from("organizations")
        .select("id, name, slug, website_url, created_at, updated_at")
        .in("id", organizationIds);

      if (organizationError) throw organizationError;

      const organizationsById = new Map(
        (organizationRows ?? []).map((organization) => [organization.id, organization] as const),
      );
      const nextMemberships = rows.map((membership) => {
        const organization = organizationsById.get(membership.org_id);
        if (!organization) {
          throw new Error("Could not load all organizations for your memberships.");
        }
        return { organization, role: membership.role };
      });

      if (cancelled) return;

      setMemberships(nextMemberships);
      setLoadedUserId(authenticatedUserId);
      const selectedOrganizationId =
        nextMemberships.find(({ organization }) => organization.id === requestedOrganizationId)
          ?.organization.id ??
        nextMemberships.find(
          ({ organization }) => organization.id === activeOrganizationIdRef.current,
        )?.organization.id ??
        nextMemberships[0]?.organization.id ??
        null;
      setActiveOrganizationId(selectedOrganizationId);
      if (selectedOrganizationId !== requestedOrganizationId) {
        updateOrganizationUrl(selectedOrganizationId);
      }
    }

    void loadMemberships()
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setMemberships([]);
        setLoadedUserId(authenticatedUserId);
        setActiveOrganizationId(null);
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authInitializing, requestedOrganizationId, updateOrganizationUrl, userId]);

  const currentMemberships = loadedUserId === userId ? memberships : [];
  const activeMembership =
    currentMemberships.find(({ organization }) => organization.id === activeOrganizationId) ?? null;

  function switchActiveOrganization(organizationId: string): boolean {
    if (!currentMemberships.some(({ organization }) => organization.id === organizationId)) {
      setError("You do not have access to that organization.");
      return false;
    }
    setActiveOrganizationId(organizationId);
    setError(null);
    updateOrganizationUrl(organizationId);
    return true;
  }

  const value: OrganisationContextValue = {
    organizations: currentMemberships.map(({ organization }) => organization),
    activeOrganization: activeMembership?.organization ?? null,
    activeOrganizationId: activeMembership?.organization.id ?? null,
    role: activeMembership?.role ?? null,
    loading: loading || authInitializing || (userId !== null && loadedUserId !== userId),
    error: loadedUserId === userId ? error : null,
    switchActiveOrganization,
  };

  return <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>;
}
