import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const single = vi.fn();
const eq = vi.fn(() => ({ single }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
    from,
  }),
}));

const originalEnv = { ...process.env };

async function loadGuards() {
  vi.resetModules();
  return import("@/lib/api/require-admin");
}

describe("requireAdmin", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    getUser.mockReset();
    from.mockClear();
    select.mockClear();
    eq.mockClear();
    single.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when session is missing", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { requireAdmin } = await loadGuards();

    const result = await requireAdmin();
    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    single.mockResolvedValue({ data: { role: "premium" }, error: null });
    const { requireAdmin } = await loadGuards();

    const result = await requireAdmin();
    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(403);
    await expect(result.error?.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns admin user when role is admin", async () => {
    const adminUser = { id: "admin-1" };
    getUser.mockResolvedValue({ data: { user: adminUser }, error: null });
    single.mockResolvedValue({ data: { role: "admin" }, error: null });
    const { requireAdmin } = await loadGuards();

    const result = await requireAdmin();
    expect(result.error).toBeNull();
    expect(result.user).toEqual(adminUser);
  });
});
