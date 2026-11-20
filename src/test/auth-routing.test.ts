import { describe, expect, it } from "vitest";

import { getSafeReturnTo, getSignInHref, isPublicAuthPath } from "@/lib/auth-routing";

describe("authentication route protection helpers", () => {
  it("only exempts sign-in and registration routes", () => {
    expect(isPublicAuthPath("/sign-in")).toBe(true);
    expect(isPublicAuthPath("/register")).toBe(true);
    expect(isPublicAuthPath("/")).toBe(false);
    expect(isPublicAuthPath("/assets")).toBe(false);
  });

  it("preserves safe internal destinations including query and hash", () => {
    expect(getSafeReturnTo("/assets?type=domain#inventory")).toBe(
      "/assets?type=domain#inventory",
    );
    expect(getSignInHref("/assets?type=domain")).toBe(
      "/sign-in?redirect=%2Fassets%3Ftype%3Ddomain",
    );
  });

  it("rejects external, protocol-relative, and auth-loop destinations", () => {
    expect(getSafeReturnTo("https://example.com")).toBeNull();
    expect(getSafeReturnTo("//example.com")).toBeNull();
    expect(getSafeReturnTo("/sign-in")).toBeNull();
    expect(getSafeReturnTo("/register")).toBeNull();
  });
});
