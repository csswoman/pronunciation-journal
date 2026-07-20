import { db, type TrackedItemRecord } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { enqueue } from "@/lib/sync/sync-manager";
import type { PersistedTrackedKind, TrackedItem } from "./types";

function toTrackedItem(row: TrackedItemRecord): TrackedItem {
  return { ...row };
}

export async function listTrackedItems(userId: string): Promise<TrackedItem[]> {
  const rows = await db.trackedItems.where("userId").equals(userId).toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toTrackedItem);
}

export async function saveTrackedItem(input: {
  userId: string;
  kind: PersistedTrackedKind;
  ref: string;
  title?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const existing = await db.trackedItems.where("[userId+kind+ref]").equals([input.userId, input.kind, input.ref]).first();
  const now = new Date().toISOString();
  const row: TrackedItemRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    userId: input.userId,
    kind: input.kind,
    ref: input.ref,
    title: input.title ?? null,
    payload: input.payload ?? {},
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.transaction("rw", [db.trackedItems, db.syncOutbox], async () => {
    await db.trackedItems.put(row);
    await enqueue(row.userId, "tracked_items", "upsert", {
      id: row.id, user_id: row.userId, kind: row.kind, ref: row.ref,
      title: row.title, payload: row.payload, created_at: row.createdAt, updated_at: row.updatedAt,
    }, undefined, "user_id,kind,ref");
  });
}

export async function removeTrackedItem(userId: string, kind: PersistedTrackedKind, ref: string): Promise<void> {
  const row = await db.trackedItems.where("[userId+kind+ref]").equals([userId, kind, ref]).first();
  if (!row) return;
  await db.transaction("rw", [db.trackedItems, db.syncOutbox], async () => {
    await db.trackedItems.delete(row.id);
    await enqueue(userId, "tracked_items", "delete", { user_id: userId }, { id: row.id, user_id: userId });
  });
}

function outboxEntryRowId(entry: { payload: Record<string, unknown>; matchKey?: Record<string, unknown> }): string | undefined {
  return (entry.matchKey?.id as string | undefined) ?? (entry.payload.id as string | undefined);
}

/**
 * Rows with any unresolved local operation (pending, in-flight, or
 * permanently failed) must never be overwritten by a remote snapshot —
 * a snapshot can be stale relative to a delete that hasn't landed yet, is
 * mid-flush, or failed and needs manual review. Only rows with no local
 * outbox activity for `tracked_items` are safe to reconcile from the server.
 */
async function unresolvedTrackedItemIds(): Promise<Set<string>> {
  const entries = await db.syncOutbox
    .where('status')
    .anyOf(['pending', 'syncing', 'failed'])
    .filter((entry) => entry.table === 'tracked_items')
    .toArray();
  const ids = new Set<string>();
  for (const entry of entries) {
    const id = outboxEntryRowId(entry);
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Refreshes the local mirror when online; all rendering remains Dexie-backed.
 * This select has no `.range()`/`.limit()`, so `data` is always the complete
 * remote set for `userId` — safe to use as the basis for reconciling local
 * rows that are absent remotely (plan 061 step 7). Never call this with a
 * partial page; a partial page cannot be distinguished from real absence.
 */
export async function hydrateTrackedItems(userId: string): Promise<void> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("tracked_items")
    .select("id, user_id, kind, ref, title, payload, created_at, updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  const remoteRows = data ?? [];
  const unresolvedIds = await unresolvedTrackedItemIds();

  await db.transaction("rw", [db.trackedItems], async () => {
    await db.trackedItems.bulkPut(remoteRows.filter((row) => !unresolvedIds.has(row.id)).map((row) => ({
      id: row.id, userId: row.user_id, kind: row.kind as PersistedTrackedKind, ref: row.ref,
      title: row.title, payload: row.payload as Record<string, unknown>, createdAt: row.created_at, updatedAt: row.updated_at,
    })));

    const remoteIds = new Set(remoteRows.map((row) => row.id));
    const localRows = await db.trackedItems.where("userId").equals(userId).toArray();
    const staleIds = localRows
      .filter((row) => !remoteIds.has(row.id) && !unresolvedIds.has(row.id))
      .map((row) => row.id);
    if (staleIds.length > 0) await db.trackedItems.bulkDelete(staleIds);
  });
}
