import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.hoisted(() =>
  vi.fn((url: string, key: string, options?: { isSingleton?: boolean }) => ({
    __url: url,
    __key: key,
    __options: options,
    from: vi.fn(),
  })),
);

vi.mock("@supabase/ssr", () => ({
  createBrowserClient,
}));

describe("getSupabaseBrowserClient", () => {
  const originalEnv = process.env;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
    // Browser-only guard in client.ts
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("disables @supabase/ssr singleton so our module owns the cache", async () => {
    const { getSupabaseBrowserClient } = await import("../client");

    getSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({ isSingleton: false }),
    );
  });

  it("recreates the client after an HMR dispose reset", async () => {
    const { getSupabaseBrowserClient, resetSupabaseBrowserClient } =
      await import("../client");

    const first = getSupabaseBrowserClient();
    const second = getSupabaseBrowserClient();
    expect(second).toBe(first);
    expect(createBrowserClient).toHaveBeenCalledTimes(1);

    resetSupabaseBrowserClient();

    const third = getSupabaseBrowserClient();
    expect(third).not.toBe(first);
    expect(createBrowserClient).toHaveBeenCalledTimes(2);
  });

  it("still reuses one client in development to avoid duplicate GoTrueClient instances", async () => {
    process.env = { ...process.env, NODE_ENV: "development" };
    const { getSupabaseBrowserClient } = await import("../client");

    const first = getSupabaseBrowserClient();
    const second = getSupabaseBrowserClient();
    expect(second).toBe(first);
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });
});
