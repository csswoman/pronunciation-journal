"use client";

import dynamic from "next/dynamic";
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
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { initSyncListeners } from "@/lib/sync/init-sync-listeners";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabaseEnabled: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LoadingWordCarousel = dynamic(
  () => import("@/components/practice/session/WordCarousel").then((mod) => mod.WordCarousel),
  { ssr: false },
);

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
    // Preserve offline-first guarantees: attempt only this account's pending
    // outbox rows, then leave any unsent rows namespaced in Dexie.
    if (user?.id) {
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox(user.id).catch(() => {});
    }
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, [supabaseEnabled, user?.id]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const cleanupSyncListeners = initSyncListeners(user?.id ?? null);
    const hydrateCEFR = async (userId: string) => {
      try {
        const { claimGuestPlacement } = await import("@/lib/courses/guest-assessment");
        const { claimGuestPronunciationDiagnostic } = await import(
          "@/lib/pronunciation/assessment/guest-transfer"
        );
        await claimGuestPlacement(userId);
        await claimGuestPronunciationDiagnostic(userId);

        const { data } = await supabase
          .from("user_profiles" as never)
          .select("cefr_level")
          .eq("id", userId)
          .maybeSingle();
        const profile = data as { cefr_level?: string } | null;

        const [{ db, ensureDbReady }, { getUserLearningState }, { hydrateFromRemote }, { normalizeCEFR }, { hydrateLessonCompletions }] = await Promise.all([
          import("@/lib/db"),
          import("@/lib/ai-practice/load-state"),
          import("@/lib/ai-practice/queries"),
          import("@/lib/exercises/cefr"),
          import("@/lib/courses/queries"),
        ]);

        await ensureDbReady();
        await hydrateFromRemote(userId);
        await hydrateLessonCompletions(userId);
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

    return () => {
      cleanupSyncListeners();
      subscription.unsubscribe();
    };
  }, [initialUser, supabaseEnabled, user?.id]);

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
    <AuthContext.Provider value={value}>
      <div key={user?.id ?? "signed-out"}>{children}</div>
    </AuthContext.Provider>
  );
}

function AuthLoadingScreen() {
  const words = useLoadingWords();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <LoadingWordCarousel words={words} />
    </div>
  );
}
