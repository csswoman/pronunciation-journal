import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const put = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { practicePrefs: { get: (...a: unknown[]) => get(...a), put: (...a: unknown[]) => put(...a) } },
}));

const { readStarterHistory, recordStarterUse, MAX_STARTER_HISTORY } = await import("../history");

beforeEach(() => {
  get.mockReset();
  put.mockReset();
});

describe("readStarterHistory", () => {
  it("returns empty history when nothing was stored yet", async () => {
    get.mockResolvedValue(undefined);
    expect(await readStarterHistory("u1")).toEqual({ ids: [], angles: [] });
  });

  it("returns empty history when the stored value is corrupt", async () => {
    get.mockResolvedValue({ value: "not json" });
    expect(await readStarterHistory("u1")).toEqual({ ids: [], angles: [] });
  });

  it("reads back what was stored", async () => {
    get.mockResolvedValue({ value: JSON.stringify({ ids: ["learn"], angles: ["an idiom"] }) });
    expect(await readStarterHistory("u1")).toEqual({ ids: ["learn"], angles: ["an idiom"] });
  });
});

describe("recordStarterUse", () => {
  it("prepends the newest use", async () => {
    get.mockResolvedValue({ value: JSON.stringify({ ids: ["free"], angles: ["free"] }) });
    await recordStarterUse("u1", "learn", "an idiom");
    const stored = JSON.parse(put.mock.calls[0][0].value);
    expect(stored.ids[0]).toBe("learn");
    expect(stored.angles[0]).toBe("an idiom");
  });

  it("caps the history so it cannot grow forever", async () => {
    const ids = Array.from({ length: MAX_STARTER_HISTORY }, () => "learn");
    get.mockResolvedValue({ value: JSON.stringify({ ids, angles: ids }) });
    await recordStarterUse("u1", "review", "an angle");
    const stored = JSON.parse(put.mock.calls[0][0].value);
    expect(stored.ids).toHaveLength(MAX_STARTER_HISTORY);
    expect(stored.angles).toHaveLength(MAX_STARTER_HISTORY);
  });

  it("scopes the key to the user", async () => {
    get.mockResolvedValue(undefined);
    await recordStarterUse("u42", "free", "free");
    expect(put.mock.calls[0][0].key).toContain("u42");
  });
});
