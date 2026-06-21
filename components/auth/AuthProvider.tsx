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
import { db } from "@/lib/db";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { normalizeCEFR } from "@/lib/exercises/cefr";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";

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
  initialUser = null,
  children,
}: {
  initialUser?: User | null;
  children: React.ReactNode;
}) {
  const supabaseEnabled = useMemo(() => isSupabaseConfigured(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(supabaseEnabled && !initialUser);

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
    const hydrateCEFR = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_profiles" as never)
          .select("cefr_level")
          .eq("id", userId)
          .maybeSingle();
        const profile = data as { cefr_level?: string } | null;
        if (!profile?.cefr_level) return;
        const nextLevel = normalizeCEFR(profile.cefr_level);
        const existing = await db.learningState.get(userId);
        if (existing) {
          await db.learningState.put({
            ...existing,
            state: { ...existing.state, level: { ...existing.state.level, cefrEstimate: nextLevel } },
            updatedAt: new Date().toISOString(),
          });
          return;
        }
        const base = await getUserLearningState(userId);
        await db.learningState.put({
          userId,
          state: { ...base, level: { ...base.level, cefrEstimate: nextLevel } },
          updatedAt: new Date().toISOString(),
        });
      } catch {}
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? initialUser);
      if (s?.user?.id) void hydrateCEFR(s.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) void hydrateCEFR(s.user.id);
    });

    return () => subscription.unsubscribe();
  }, [initialUser, supabaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      supabaseEnabled,
      signOutUser,
    }),
    [user, session, loading, supabaseEnabled, signOutUser]
  );

  if (!supabaseEnabled) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <AuthLoadingScreen />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

function AuthLoadingScreen() {
  const words = useLoadingWords();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <WordCarousel words={words} />
    </div>
  );
}
