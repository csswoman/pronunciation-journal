// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, ensureDbReady } from "@/lib/db";

describe("ensureDbReady", () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
  });

  afterEach(() => {
    db.close();
    vi.restoreAllMocks();
  });

  it("opens IndexedDB for subsequent reads", async () => {
    await ensureDbReady();
    await db.practicePrefs.put({
      key: "smoke",
      value: "ok",
      updatedAt: new Date().toISOString(),
    });
    await expect(db.practicePrefs.get("smoke")).resolves.toMatchObject({ value: "ok" });
  });

  it("recreates the database after a fatal schema open error", async () => {
    const schemaError = Object.assign(new Error("Not yet support for changing primary key"), {
      name: "UpgradeError",
    });
    const open = vi.spyOn(db, "open");
    open
      .mockRejectedValueOnce(schemaError)
      .mockRejectedValueOnce(schemaError)
      .mockResolvedValueOnce(db);

    const del = vi.spyOn(db, "delete").mockResolvedValue(undefined);

    await expect(ensureDbReady()).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledTimes(3);
  });

  it("retries Chrome UnknownError / DatabaseClosedError without deleting the database", async () => {
    const closed = Object.assign(
      new Error("UnknownError Internal error.\n UnknownError: Internal error."),
      { name: "DatabaseClosedError" },
    );
    const open = vi.spyOn(db, "open");
    open
      .mockRejectedValueOnce(closed)
      .mockRejectedValueOnce(closed)
      .mockResolvedValueOnce(db);
    const del = vi.spyOn(db, "delete");

    await expect(ensureDbReady()).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(3);
  });

  it("treats a recovered connection as ready when open() rejects but isOpen() is true", async () => {
    const closed = Object.assign(new Error("UnknownError Internal error."), {
      name: "DatabaseClosedError",
    });
    vi.spyOn(db, "open").mockRejectedValue(closed);
    vi.spyOn(db, "isOpen").mockReturnValueOnce(false).mockReturnValue(true);
    const del = vi.spyOn(db, "delete");

    await expect(ensureDbReady()).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();
  });
});
