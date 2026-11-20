import { supabase } from "@/integrations/supabase/client";

export function generateOrganizationSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");

  return slug || "organization";
}

export async function createOrganization(
  organizationName: string,
  website: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: organizationName.trim(),
    p_slug: generateOrganizationSlug(organizationName),
    p_website_url: website?.trim() || null,
  });

  if (error) throw error;
  if (!data) throw new Error("Organization creation returned no identifier.");

  return data;
}
