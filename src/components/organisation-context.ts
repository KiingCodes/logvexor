import { createContext, useContext } from "react";

import type { OrganizationRole, Tables } from "@/integrations/supabase/types";

export type Organization = Pick<
  Tables<"organizations">,
  "id" | "name" | "slug" | "website_url" | "created_at" | "updated_at"
>;

export interface OrganisationMembership {
  organization: Organization;
  role: OrganizationRole;
}

export interface OrganisationContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeOrganizationId: string | null;
  role: OrganizationRole | null;
  loading: boolean;
  error: string | null;
  switchActiveOrganization: (organizationId: string) => boolean;
}

export const OrganisationContext =
  createContext<OrganisationContextValue | null>(null);

export function useOrganisation(): OrganisationContextValue {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error("useOrganisation must be used within an OrganisationProvider.");
  }
  return context;
}
