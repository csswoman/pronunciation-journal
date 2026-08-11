// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

import { db } from "@/lib/db";
import {
  getUncodedFailedBundleGap,
  recoverResolvedSchemaFailures,
} from "../schema-failure-recovery";
import { flushOutbox } from "../sync-manager";
import type { SyncOutboxEntry } from "../types";

const USER = "user-1";

function failed(
  id: number,
  bundleId: string,
  errorCode: string | undefined,
  createdAt = "2026-08-09T10:00:00.000Z",
): SyncOutboxEntry {
  return {
    id,
    userId: USER,
    table: id % 2 ? "attempt_logs" : "learning_items",
    operation: id % 2 ? "insert" : "upsert",
    payload: { id: `id-${id}`, user_id: USER },
    bundleId,
    status: "failed",
    retryCount: 1,
    createdAt,
    lastAttemptAt: createdAt,
    errorMessage: "schema mismatch",
    ...(errorCode ? { errorCode, errorDetails: "rendered_mode", errorHint: "reload schema" } : {}),
  };
}

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
  Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });
  from.mockReset();
});

afterEach(() => db.close());

describe("recoverResolvedSchemaFailures", () => {
  it("reencola solo el bundle con código de esquema permitido y conserva sus IDs", async () => {
    await db.syncOutbox.bulkAdd([
      failed(1, "schema-bundle", "PGRST204"),
      failed(2, "schema-bundle", "PGRST204"),
      failed(3, "rls-bundle", "42501"),
    ]);

    const result = await recoverResolvedSchemaFailures(USER, { verifyResolved: async () => true });
    const entries = await db.syncOutbox.toArray();

    expect(result).toMatchObject({ requeuedBundles: 1, requeuedEntries: 2, schemaResolved: true });
    expect(entries.find((entry) => entry.bundleId === "schema-bundle")).toMatchObject({
      status: "pending", retryCount: 0,
    });
    expect(entries.filter((entry) => entry.bundleId === "schema-bundle").map((entry) => entry.id))
      .toEqual([1, 2]);
    expect(entries.find((entry) => entry.bundleId === "rls-bundle")).toMatchObject({ status: "failed" });
  });

  it("no reencola bundles históricos sin código y registra su rango de fechas", async () => {
    await db.syncOutbox.bulkAdd([
      failed(1, "legacy-a", undefined, "2026-08-01T10:00:00.000Z"),
      failed(2, "legacy-b", undefined, "2026-08-03T10:00:00.000Z"),
    ]);

    const result = await recoverResolvedSchemaFailures(USER, { verifyResolved: async () => true });
    expect(result.uncodedGap).toEqual({
      count: 2,
      oldestFailedAt: "2026-08-01T10:00:00.000Z",
      newestFailedAt: "2026-08-03T10:00:00.000Z",
    });
    expect(await getUncodedFailedBundleGap(USER)).toEqual(result.uncodedGap);
    expect((await db.syncOutbox.toArray()).every((entry) => entry.status === "failed")).toBe(true);
  });

  it("respeta el tope de bundles por pasada", async () => {
    await db.syncOutbox.bulkAdd(Array.from({ length: 12 }, (_, index) =>
      failed(index + 1, `bundle-${index + 1}`, "PGRST204", `2026-08-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`),
    ));

    const result = await recoverResolvedSchemaFailures(USER, {
      maxBundles: 3,
      verifyResolved: async () => true,
    });
    expect(result).toMatchObject({ requeuedBundles: 3, requeuedEntries: 3 });
    expect(await db.syncOutbox.where("status").equals("pending").count()).toBe(3);
  });

  it("sincroniza idempotentemente un bundle reencolado que ya llegó al remoto", async () => {
    await db.syncOutbox.add(failed(1, "already-applied", "PGRST204"));
    await recoverResolvedSchemaFailures(USER, { verifyResolved: async () => true });
    from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: "duplicate key", code: "23505" } }),
    });

    const result = await flushOutbox(USER);
    expect(result).toMatchObject({ synced: 1, failed: 0 });
    expect(await db.syncOutbox.count()).toBe(0);
  });
});
