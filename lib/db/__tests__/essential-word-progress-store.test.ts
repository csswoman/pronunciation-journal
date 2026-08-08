import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, getEssentialWordProgress, saveEssentialWordProgress, archiveEssentialWordProgress } from "@/lib/db";

describe("essentialWordProgress table", () => {
  beforeEach(async () => {
    await db.essentialWordProgress.clear();
  });

  it("saveEssentialWordProgress writes a row and getEssentialWordProgress reads it back", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 2,
    });
    const row = await getEssentialWordProgress("c1k:the", "user-1");
    expect(row).toMatchObject({ wordId: "c1k:the", userId: "user-1", highestLevel: 1, attempts: 2 });
  });

  it("getEssentialWordProgress returns undefined for an unknown word", async () => {
    expect(await getEssentialWordProgress("c1k:nope", "user-1")).toBeUndefined();
  });

  it("saveEssentialWordProgress overwrites the existing row for the same word+user", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 1,
    });
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 2, lastLevelAt: "2026-06-02T00:00:00.000Z", lastSessionId: "s2", attempts: 3,
    });
    const row = await getEssentialWordProgress("c1k:the", "user-1");
    expect(row?.highestLevel).toBe(2);
    expect(row?.attempts).toBe(3);
  });

  it("archiveEssentialWordProgress deletes the row", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 3, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 0,
    });
    await archiveEssentialWordProgress("c1k:the", "user-1");
    expect(await getEssentialWordProgress("c1k:the", "user-1")).toBeUndefined();
  });

  it("scopes rows by userId — two users' progress on the same word do not collide", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 0,
    });
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-2", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 3, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s2", attempts: 0,
    });
    expect((await getEssentialWordProgress("c1k:the", "user-1"))?.highestLevel).toBe(1);
    expect((await getEssentialWordProgress("c1k:the", "user-2"))?.highestLevel).toBe(3);
  });
});
