// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, ensureDbReady } from "@/lib/db";

describe("Dexie schema integrity", () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
  });

  afterEach(() => {
    db.close();
    vi.restoreAllMocks();
  });

  it("opens a fresh database without SchemaDiff warnings", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await ensureDbReady();

    const schemaDiffWarnings = warn.mock.calls.filter((args) =>
      String(args[0]).includes("SchemaDiff"),
    );
    expect(schemaDiffWarnings).toEqual([]);
    expect(db.verno).toBeGreaterThanOrEqual(26);

    // V2 replacement stores from v25 must exist on a fresh DB.
    expect(db.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining([
        "pronunciationMasteryV2",
        "pronunciationCoachStateV2",
        "learningState",
        "practicePrefs",
        "analyticsEvents",
      ]),
    );
  });

  it("reopens an existing v26 database without SchemaDiff warnings", async () => {
    await ensureDbReady();
    db.close();

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await ensureDbReady();

    const schemaDiffWarnings = warn.mock.calls.filter((args) =>
      String(args[0]).includes("SchemaDiff"),
    );
    expect(schemaDiffWarnings).toEqual([]);
  });
});
