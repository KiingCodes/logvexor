import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc },
}));

import {
  createOrganization,
  generateOrganizationSlug,
} from "@/lib/organization-onboarding";

describe("organization onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates lowercase slugs and replaces unsupported character groups", () => {
    expect(generateOrganizationSlug("  Acme, Inc. / Security  ")).toBe(
      "acme-inc-security",
    );
    expect(generateOrganizationSlug("!!!")).toBe("organization");
    expect(generateOrganizationSlug("a".repeat(70))).toHaveLength(63);
  });

  it("submits the organization name, generated slug, and optional website", async () => {
    const organizationId = "62c8227a-b0a2-42fa-8cfe-3f9f23e39516";
    mocks.rpc.mockResolvedValue({ data: organizationId, error: null });

    await expect(
      createOrganization(" Acme, Inc. ", " https://acme.example "),
    ).resolves.toBe(organizationId);

    expect(mocks.rpc).toHaveBeenCalledWith("create_organization", {
      p_name: "Acme, Inc.",
      p_slug: "acme-inc",
      p_website_url: "https://acme.example",
    });
  });

  it("passes through RPC errors for the form to display", async () => {
    const error = { code: "23505", message: "duplicate slug" };
    mocks.rpc.mockResolvedValue({ data: null, error });

    await expect(createOrganization("Acme", null)).rejects.toBe(error);
  });
});
