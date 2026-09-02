// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

let authStateCallback: ((event: string, session: unknown) => void) | null = null;
const getSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession,
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  }),
}));

// Guest bootstrap must never fire in these tests: we assert on the signed-out
// state, which only exists when no anonymous session is created.
vi.mock("@/lib/supabase/auth-actions", () => ({
  signInAsGuest: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
}));

vi.mock("@/lib/sync/init-sync-listeners", () => ({
  initSyncListeners: () => () => {},
}));

vi.mock("@/lib/auth/cache-cleanup", () => ({
  clearClientCachesOnLogout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/auth/useOAuthIdentityRecovery", () => ({
  useOAuthIdentityRecovery: () => {},
}));

vi.mock("@/hooks/useLoadingWords", () => ({
  useLoadingWords: () => ["cargando"],
}));

vi.mock("@/lib/db", () => ({
  ensureDbReady: vi.fn().mockResolvedValue(undefined),
  db: {},
}));

import AuthProvider from "@/components/auth/AuthProvider";

describe("AuthProvider signed-out handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
  });

  it("redirects out of the authenticated tree instead of hanging on the loader", async () => {
    const user = { id: "user-1", is_anonymous: false };
    getSession.mockResolvedValue({ data: { session: { user } } });

    render(
      <AuthProvider initialUser={user as never}>
        <div>contenido protegido</div>
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("contenido protegido")).toBeInTheDocument(),
    );

    // Simulate the SIGNED_OUT event that supabase.auth.signOut() emits.
    authStateCallback?.("SIGNED_OUT", null);

    // The provider must navigate away rather than parking on the loading
    // screen: its guest-bootstrap effect only runs on mount, so nothing else
    // would ever resolve a null user.
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?intent=explore"),
    );
    await waitFor(() =>
      expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument(),
    );
  });
});
