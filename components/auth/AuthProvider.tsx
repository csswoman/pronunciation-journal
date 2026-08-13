"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signInAsGuest } from "@/lib/supabase/auth-actions";
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
  const router = useRouter();
  const supabaseEnabled = useMemo(() => isSupabaseConfigured(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(supabaseEnabled && !initialUser);
  const guestBootstrapTried = useRef(false);

  const signOutUser = useCallback(async () => {
    if (!supabaseEnabled) return;
    // Preserve offline-first guarantees: attempt only this account's pending
    // outbox rows, then leave any unsent rows namespaced in Dexie.
    if (user?.id) {
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox(user.id).catch(() => {});
    }
    // Allow a fresh anonymous bootstrap after sign-out (explore-first).
    guestBootstrapTried.current = false;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, [supabaseEnabled, user?.id]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    let cleanupSyncListeners = () => {};
    void import("@/lib/db").then(async ({ ensureDbReady }) => {
      await ensureDbReady().catch(() => {});
      if (cancelled) return;
      cleanupSyncListeners = initSyncListeners(user?.id ?? null);
    });
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

        const [
          { db, ensureDbReady },
          { getUserLearningState },
          { hydrateFromRemote },
          { normalizeCEFR },
          { hydrateLessonCompletions },
        ] = await Promise.all([
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
            state: {
              ...existing.state,
              level: { ...existing.state.level, cefrEstimate: nextLevel },
            },
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
      } catch {
        /* hydration is best-effort */
      }
    };

    const bootstrapGuestIfNeeded = async (current: Session | null) => {
      if (current?.user) return { session: current, didBootstrap: false };
      if (guestBootstrapTried.current) return { session: null, didBootstrap: false };
      guestBootstrapTried.current = true;
      const { data, error } = await signInAsGuest();
      if (error || !data.session) {
        console.error("[auth] guest bootstrap failed", error);
        router.replace("/login?intent=explore");
        return { session: null, didBootstrap: false };
      }
      return { session: data.session, didBootstrap: true };
    };

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      const hadUser = Boolean(s?.user);
      const { session: resolved, didBootstrap } = hadUser
        ? { session: s, didBootstrap: false }
        : await bootstrapGuestIfNeeded(s);
      setSession(resolved);
      setUser(resolved?.user ?? null);
      if (resolved?.user?.id) void hydrateCEFR(resolved.user.id);
      setLoading(false);
      // Re-run RSC loaders now that the anonymous cookie exists.
      if (didBootstrap) router.refresh();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user?.id) void hydrateCEFR(s.user.id);
    });

    return () => {
      cancelled = true;
      cleanupSyncListeners();
      subscription.unsubscribe();
    };
  }, [initialUser, router, supabaseEnabled, user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      supabaseEnabled,
      signOutUser,
    }),
    [user, session, loading, supabaseEnabled, signOutUser],
  );

  if (!supabaseEnabled) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <AuthLoadingScreen />
      </AuthContext.Provider>
    );
  }

  // Stay on the loading screen while redirecting after a failed bootstrap.
  if (!user) {
    return (
      <AuthContext.Provider value={value}>
        <AuthLoadingScreen />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <div key={user.id}>{children}</div>
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
