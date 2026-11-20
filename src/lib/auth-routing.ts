const RETURN_TO_BASE = "https://logvexor.invalid";

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/sign-in" || pathname === "/register";
}

export function getSafeReturnTo(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const destination = new URL(value, RETURN_TO_BASE);
    if (
      destination.origin !== RETURN_TO_BASE ||
      isPublicAuthPath(destination.pathname)
    ) {
      return null;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

export function getSignInHref(returnTo: string): string {
  const destination = getSafeReturnTo(returnTo) ?? "/";
  return `/sign-in?redirect=${encodeURIComponent(destination)}`;
}
