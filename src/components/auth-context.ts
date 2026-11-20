import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<{ hasSession: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ hasSession: boolean }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
