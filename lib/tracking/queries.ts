import Dexie from "dexie";
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
    await enqueue("tracked_items", "upsert", {
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
    await enqueue("tracked_items", "delete", { user_id: userId }, { id: row.id, user_id: userId });
  });
}

/** Refreshes the local mirror when online; all rendering remains Dexie-backed. */
export async function hydrateTrackedItems(userId: string): Promise<void> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("tracked_items")
    .select("id, user_id, kind, ref, title, payload, created_at, updated_at")
    .eq("user_id", userId);
  if (error) throw error;
  const pendingRows = await db.syncOutbox
    .where('[status+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .filter((entry) => entry.table === 'tracked_items')
    .toArray();
  const pendingIds = new Set(pendingRows.map((entry) => entry.payload.id as string));
  await db.trackedItems.bulkPut((data ?? []).filter((row) => !pendingIds.has(row.id)).map((row) => ({
    id: row.id, userId: row.user_id, kind: row.kind as PersistedTrackedKind, ref: row.ref,
    title: row.title, payload: row.payload as Record<string, unknown>, createdAt: row.created_at, updatedAt: row.updated_at,
  })));
}
