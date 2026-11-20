import { act, render, waitFor } from "@testing-library/react";
import type { Session, User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/components/auth-provider";
import { useAuth, type AuthContextValue } from "@/components/auth-context";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      signUp: mocks.signUp,
    },
    from: mocks.from,
  },
}));

function makeUser(): User {
  return {
    id: "user-123",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: " Ada Lovelace " },
    aud: "authenticated",
    created_at: "2026-11-20T00:00:00.000Z",
  } satisfies User;
}

async function renderAuthProvider(): Promise<AuthContextValue> {
  let context: AuthContextValue | null = null;
  function Probe() {
    context = useAuth();
    return null;
  }

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(context?.initializing).toBe(false));
  if (!context) throw new Error("Auth context did not render.");
  return context;
}

describe("AuthProvider profile creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.from.mockReturnValue({ upsert: mocks.upsert });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it("does not insert a profile when signup requires email confirmation", async () => {
    const user = makeUser();
    mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    const context = await renderAuthProvider();

    await act(async () => {
      await context.signUp("ada@example.com", "password1234", "Ada Lovelace");
    });

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("creates a profile from registration metadata when signup returns a session", async () => {
    const user = makeUser();
    mocks.signUp.mockResolvedValue({
      data: { user, session: { user } as Session },
      error: null,
    });
    const context = await renderAuthProvider();

    await act(async () => {
      await context.signUp("ada@example.com", "password1234", "Ada Lovelace");
    });

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      { id: user.id, display_name: "Ada Lovelace" },
      { onConflict: "id", ignoreDuplicates: true },
    );
  });

  it("creates a missing profile after the user signs in following email confirmation", async () => {
    const user = makeUser();
    mocks.signInWithPassword.mockResolvedValue({
      data: { user, session: { user } as Session },
      error: null,
    });
    const context = await renderAuthProvider();

    await act(async () => {
      await context.signIn("ada@example.com", "password1234");
    });

    expect(mocks.upsert).toHaveBeenCalledWith(
      { id: user.id, display_name: "Ada Lovelace" },
      { onConflict: "id", ignoreDuplicates: true },
    );
  });
});
