import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { AuthContext, type AuthContextValue } from "@/components/auth-context";
import { supabase } from "@/integrations/supabase/client";

function errorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

async function ensureProfile(user: User): Promise<void> {
  const fullName = user.user_metadata["full_name"];
  const displayName =
    typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;
  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, display_name: displayName },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      setSession(nextSession);
      setInitializing(false);
      setInitializationError(null);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authEventReceived) return;

        setSession(error ? null : data.session);
        setInitializationError(error?.message ?? null);
        setInitializing(false);
      })
      .catch((error: unknown) => {
        if (!active || authEventReceived) return;

        setSession(null);
        setInitializationError(errorMessage(error, "Unable to restore your Supabase session."));
        setInitializing(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<{ hasSession: boolean }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) await ensureProfile(data.session.user);
    return { hasSession: data.session !== null };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ hasSession: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    if (data.session) await ensureProfile(data.session.user);
    return { hasSession: data.session !== null };
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    initializing,
    initializationError,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
