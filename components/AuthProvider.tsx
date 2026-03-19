"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import AuthPanel from "./AuthPanel";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseEnabled = useMemo(() => isSupabaseConfigured(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  const signOutUser = useCallback(async () => {
    if (!supabaseEnabled) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, [supabaseEnabled]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [supabaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      supabaseEnabled,
      signOutUser,
    }),
    [session, loading, supabaseEnabled, signOutUser]
  );

  if (!supabaseEnabled) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">Cargando sesión…</p>
        </div>
      </AuthContext.Provider>
    );
  }

  if (!session) {
    return (
      <AuthContext.Provider value={value}>
        <AuthPanel />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
