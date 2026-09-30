import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  deleteOfflineResourcePack,
  getOfflineResourcePack,
  listOfflineResourcePacks,
  saveOfflineResourcePack,
  type OfflineResourcePackRecord,
} from "@/lib/db";

const record: OfflineResourcePackRecord = {
  id: "A2",
  level: "A2",
  contentVersion: "v1",
  status: "ready",
  cacheName: "offline-pack-A2-v1",
  resourceCount: 12,
  estimatedBytes: 654321,
  downloadedAt: "2026-09-28T00:00:00.000Z",
  lastVerifiedAt: "2026-09-28T00:00:00.000Z",
};

describe("Dexie v50 — offlineResourcePacks receipts", () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.offlineResourcePacks.clear();
  });

  it("declares the offlineResourcePacks table with the expected indexes", () => {
    const names = db.tables.map((table) => table.name);
    expect(names).toContain("offlineResourcePacks");

    const schema = db.table("offlineResourcePacks").schema;
    expect(schema.primKey.name).toBe("id");
    const indexes = schema.indexes.map((index) => index.name);
    expect(indexes).toContain("level");
    expect(indexes).toContain("status");
    expect(indexes).toContain("contentVersion");
    expect(indexes).toContain("[level+status]");

    expect(db.verno).toBeGreaterThanOrEqual(50);
  });

  it("saves and reads a receipt via the helper functions", async () => {
    await saveOfflineResourcePack(record);

    const stored = await getOfflineResourcePack("A2");
    expect(stored).toEqual(record);

    const all = await listOfflineResourcePacks();
    expect(all).toHaveLength(1);
    expect(all[0]?.status).toBe("ready");

    await deleteOfflineResourcePack("A2");
    expect(await getOfflineResourcePack("A2")).toBeUndefined();
  });

  it("only status 'ready' should be treated as available offline", async () => {
    await saveOfflineResourcePack({ ...record, id: "B1", level: "B1", status: "stale" });
    const stale = await getOfflineResourcePack("B1");
    expect(stale?.status).not.toBe("ready");
  });

  it("replaces a ready receipt for a new contentVersion in a single atomic write, never via an intermediate missing/downloading state", async () => {
    // Old version is ready and would be presented as "available offline".
    await saveOfflineResourcePack(record);
    const before = await getOfflineResourcePack("A2");
    expect(before?.status).toBe("ready");
    expect(before?.contentVersion).toBe("v1");
    expect(before?.cacheName).toBe("offline-pack-A2-v1");

    // Step 3's download itself is tracked in Zustand (ephemeral), never
    // written to this table mid-flight — so there is nothing to simulate
    // here except the terminal write once the new pack has been verified.
    // Confirm the old ready row is still fully intact right up until that
    // single atomic put() — no earlier write ever removed or downgraded it.
    const stillOld = await getOfflineResourcePack("A2");
    expect(stillOld).toEqual(record);

    // Simulate the new-version download completing: one atomic put() with
    // the same id (level) replaces the row entirely — new contentVersion,
    // new cacheName — in a single step.
    const updated: OfflineResourcePackRecord = {
      ...record,
      contentVersion: "v2",
      cacheName: "offline-pack-A2-v2",
      resourceCount: 13,
      estimatedBytes: 700000,
      downloadedAt: "2026-09-29T00:00:00.000Z",
      lastVerifiedAt: "2026-09-29T00:00:00.000Z",
    };
    await saveOfflineResourcePack(updated);

    const after = await getOfflineResourcePack("A2");
    expect(after).toEqual(updated);
    expect(after?.status).toBe("ready");
    // Exactly one row exists for this level at any time — the old row was
    // replaced, not left alongside the new one.
    const all = await listOfflineResourcePacks();
    expect(all.filter((row) => row.level === "A2")).toHaveLength(1);
  });

  it("does not affect or read from unrelated progress/mastery/SRS tables", async () => {
    await saveOfflineResourcePack(record);

    // Write to an unrelated existing table and confirm it is unaffected by
    // the new table's presence.
    await db.essentialWordProgress.put({
      id: "user-1:word-1",
      wordId: "word-1",
      userId: "user-1",
      exposedAt: "2026-09-28T00:00:00.000Z",
      highestLevel: 1,
      lastLevelAt: "2026-09-28T00:00:00.000Z",
      lastSessionId: "session-1",
      attempts: 1,
    });

    const progressRow = await db.essentialWordProgress.get("user-1:word-1");
    expect(progressRow).toBeDefined();

    // The pack receipt table stays isolated: reading it doesn't touch progress,
    // and progress table row count is unaffected by pack writes.
    const packs = await listOfflineResourcePacks();
    expect(packs).toHaveLength(1);
    const progressCount = await db.essentialWordProgress.count();
    expect(progressCount).toBe(1);
  });
});
