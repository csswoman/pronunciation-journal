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
import { useOAuthIdentityRecovery } from "@/components/auth/useOAuthIdentityRecovery";
import { clearClientCachesOnLogout } from "@/lib/auth/cache-cleanup";

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

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
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
  // Once the user signs out explicitly, `initialUser` (server-rendered, and
  // therefore still populated) must never resurrect the session on a re-render.
  const signedOut = useRef(false);

  const signOutUser = useCallback(async () => {
    if (!supabaseEnabled) return;
    // Preserve offline-first guarantees: attempt only this account's pending
    // outbox rows, then leave any unsent rows namespaced in Dexie.
    if (user?.id) {
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox(user.id).catch(() => {});
    }
    await clearClientCachesOnLogout();
    // Allow a fresh anonymous bootstrap after sign-out (explore-first).
    guestBootstrapTried.current = false;
    signedOut.current = true;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, [supabaseEnabled, user?.id]);

  useOAuthIdentityRecovery();

  const currentUserIdRef = useRef<string | null>(initialUser?.id ?? null);
  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let cleanupSyncListeners = () => {};
    const hydrationPromises = new Map<string, Promise<void>>();

    void import("@/lib/db").then(async ({ ensureDbReady }) => {
      await ensureDbReady().catch(() => {});
      if (cancelled) return;
      cleanupSyncListeners = initSyncListeners(currentUserIdRef.current);
    });

    const hydrateCEFR = async (userId: string) => {
      if (hydrationPromises.has(userId)) return hydrationPromises.get(userId)!;
      const promise = (async () => {
        try {
          const { claimGuestPlacement } = await import("@/lib/courses/guest-assessment");
          const { claimGuestPronunciationDiagnostic } = await import(
            "@/lib/pronunciation/assessment/guest-transfer"
          );
          await claimGuestPlacement(userId);
          await claimGuestPronunciationDiagnostic(userId);

          const { data } = await getSupabaseBrowserClient()
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
      })().finally(() => {
        hydrationPromises.delete(userId);
      });

      hydrationPromises.set(userId, promise);
      return promise;
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

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      // A sign-out landed while this was in flight — do not revive the session.
      if (cancelled || signedOut.current) return;
      const hadUser = Boolean(s?.user);
      const { session: resolved, didBootstrap } = hadUser
        ? { session: s, didBootstrap: false }
        : await bootstrapGuestIfNeeded(s);
      const nextUserId = resolved?.user?.id ?? null;
      currentUserIdRef.current = nextUserId;
      setSession(resolved);
      setUser(resolved?.user ?? null);
      if (nextUserId) void hydrateCEFR(nextUserId);
      setLoading(false);
      // Re-run RSC loaders now that the anonymous cookie exists.
      if (didBootstrap) router.refresh();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") signedOut.current = true;
      const nextUserId = s?.user?.id ?? null;
      const userIdChanged = nextUserId !== currentUserIdRef.current;
      currentUserIdRef.current = nextUserId;
      setSession(s);
      setUser(s?.user ?? null);

      if (userIdChanged) {
        cleanupSyncListeners();
        cleanupSyncListeners = initSyncListeners(nextUserId);
      }

      // Avoid re-running full remote hydration on background events when user hasn't changed
      if (nextUserId && userIdChanged) {
        void hydrateCEFR(nextUserId);
      }
    });

    return () => {
      cancelled = true;
      cleanupSyncListeners();
      subscription.unsubscribe();
    };
  }, [initialUser, router, supabaseEnabled]);

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

  // No user and not loading: sign-out, an expired session, or a failed guest
  // bootstrap. Never park on the loading screen here — the bootstrap effect only
  // runs on mount, so nothing would ever resolve it. SignedOutRedirect sends the
  // user out of the authenticated tree instead.
  if (!user) {
    return (
      <AuthContext.Provider value={value}>
        <SignedOutRedirect />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <div key={user.id}>{children}</div>
    </AuthContext.Provider>
  );
}

/**
 * Renders the loading screen while pushing the user to explore-first login.
 * Effect-based so the navigation happens after paint, never during render.
 */
function SignedOutRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?intent=explore");
  }, [router]);
  return <AuthLoadingScreen />;
}

function AuthLoadingScreen() {
  const words = useLoadingWords();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <LoadingWordCarousel words={words} />
    </div>
  );
}
