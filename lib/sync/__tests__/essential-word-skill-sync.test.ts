// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncOutboxEntry } from "../types";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  transaction: vi.fn(),
  where: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  modify: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.from, rpc: vi.fn() }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    syncOutbox: {
      add: vi.fn(),
      delete: (...args: unknown[]) => mocks.remove(...args),
      update: (...args: unknown[]) => mocks.update(...args),
      where: (...args: unknown[]) => mocks.where(...args),
    },
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
  ensureDbReady: () => Promise.resolve(),
}));

vi.mock("dexie", () => ({
  default: class {
    static minKey = -Infinity;
    static maxKey = Infinity;
  },
}));

vi.mock("../recovery", () => ({
  reclaimStaleSyncingEntries: vi.fn().mockResolvedValue(0),
  isReadyToRetry: () => true,
  getNextRetryAt: () => "2026-08-06T10:00:05.000Z",
}));

import { flushOutbox } from "../sync-manager";

const entry = (
  id: number,
  table: SyncOutboxEntry["table"],
  operation: SyncOutboxEntry["operation"],
  payload: Record<string, unknown>,
  userId = "user-1",
  bundleId = "attempt-1",
): SyncOutboxEntry => ({
  id,
  userId,
  table,
  operation,
  payload,
  bundleId,
  status: "pending",
  retryCount: 0,
  createdAt: `2026-08-06T10:00:${String(id).padStart(2, "0")}.000Z`,
});

function setupFlush(entries: SyncOutboxEntry[]): void {
  mocks.where.mockImplementation(() => ({
    between: (lower: [string, string, unknown]) => ({
      toArray: async () => entries.filter((candidate) => candidate.userId === lower[0]),
    }),
    anyOf: () => ({
      modify: mocks.modify,
      filter: () => ({ modify: mocks.modify }),
    }),
  }));
  mocks.transaction.mockImplementation(
    async (_mode: string, _table: unknown, fn: () => Promise<unknown>) => fn(),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
  });
  mocks.remove.mockResolvedValue(undefined);
  mocks.update.mockResolvedValue(1);
  mocks.modify.mockResolvedValue(0);
});

describe("sincronización causal del modelo de habilidades", () => {
  it("envía el ítem y el intento antes que su evento aunque la cola llegue desordenada", async () => {
    const calls: string[] = [];
    const upsertOptions: unknown[] = [];
    setupFlush([
      entry(3, "srs_review_events", "insert", {
        id: "event-1", user_id: "user-1", attempt_log_id: "attempt-1",
      }),
      entry(2, "attempt_logs", "insert", { id: "attempt-1", user_id: "user-1" }),
      entry(1, "learning_items", "upsert", { id: "item-1", user_id: "user-1" }),
    ]);
    mocks.from.mockImplementation((table: string) => ({
      insert: async () => { calls.push(`${table}:insert`); return { error: null }; },
      upsert: async (_payload: unknown, options: unknown) => {
        calls.push(`${table}:upsert`);
        upsertOptions.push(options);
        return { error: null };
      },
    }));

    await flushOutbox("user-1");

    expect(calls).toEqual([
      "learning_items:upsert",
      "attempt_logs:insert",
      "srs_review_events:insert",
    ]);
    expect(upsertOptions).toEqual([{ onConflict: "user_id,id" }]);
  });

  it("trata reintentos por ID de intentos y eventos como éxito idempotente", async () => {
    setupFlush([
      entry(1, "attempt_logs", "insert", { id: "attempt-1", user_id: "user-1" }),
      entry(2, "srs_review_events", "insert", {
        id: "event-1", user_id: "user-1", attempt_log_id: "attempt-1",
      }),
    ]);
    mocks.from.mockImplementation(() => ({
      insert: async () => ({ error: { message: "duplicate key", code: "23505" } }),
    }));

    const result = await flushOutbox("user-1");

    expect(result).toMatchObject({ synced: 2, failed: 0 });
    expect(mocks.remove).toHaveBeenCalledWith(1);
    expect(mocks.remove).toHaveBeenCalledWith(2);
  });

  it("mantiene un evento huérfano como fallo observable", async () => {
    setupFlush([
      entry(1, "srs_review_events", "insert", {
        id: "event-orphan", user_id: "user-1", attempt_log_id: "missing",
      }),
    ]);
    mocks.from.mockReturnValue({
      insert: async () => ({ error: { message: "foreign key violation", code: "23503" } }),
    });

    const result = await flushOutbox("user-1");

    expect(result.operations[0]).toMatchObject({ outcome: "failed", table: "srs_review_events" });
    expect(mocks.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "failed" }));
    expect(mocks.remove).not.toHaveBeenCalledWith(1);
  });

  it("solo reclama entradas de la cuenta solicitada", async () => {
    setupFlush([
      entry(1, "attempt_logs", "insert", { id: "a-1", user_id: "user-1" }, "user-1"),
      entry(2, "attempt_logs", "insert", { id: "a-2", user_id: "user-2" }, "user-2"),
    ]);
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert });

    await flushOutbox("user-1");

    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1" }));
  });

  it("conserva el evento del bundle tras un error remoto parcial", async () => {
    setupFlush([
      entry(1, "learning_items", "upsert", { id: "item-1", user_id: "user-1" }),
      entry(2, "attempt_logs", "insert", { id: "attempt-1", user_id: "user-1" }),
      entry(3, "srs_review_events", "insert", {
        id: "event-1", user_id: "user-1", attempt_log_id: "attempt-1",
      }),
    ]);
    mocks.from.mockImplementation((table: string) => ({
      upsert: async () => ({ error: null }),
      insert: async () => table === "srs_review_events"
        ? { error: { message: "network unavailable", code: "503" } }
        : { error: null },
    }));

    const result = await flushOutbox("user-1");

    expect(result).toMatchObject({ synced: 2, failed: 1 });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalledWith(3);
    expect(mocks.update).toHaveBeenCalledWith(1, expect.objectContaining({ status: "pending" }));
    expect(mocks.update).toHaveBeenCalledWith(2, expect.objectContaining({ status: "pending" }));
    expect(mocks.update).toHaveBeenCalledWith(3, expect.objectContaining({ status: "pending" }));
  });
});
