import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { db, type CoachBankLevelCacheRecord, type ContentBankCacheRecord } from "@/lib/db";
import type { CEFRLevel } from "@/lib/exercises/cefr";
import { getEffectiveLearnerLevelForViewer } from "@/lib/learner-level/client-queries";
import type { ContentBankItem } from "./types";

/**
 * Fetches pregenerated exercise items from the content bank in Supabase.
 * Respects RLS (authenticated, quality_flags < 3).
 */
export async function fetchBankItems(
  level: string,
  topicIds?: string[],
  limit: number = 30,
): Promise<ContentBankItem[]> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("content_bank_items")
    .select(
      "id, kind, tool_name, level, topic_id, payload, prompt_version, stem_hash, quality_flags, created_at",
    )
    .eq("kind", "coach_exercise")
    .eq("level", level)
    .lt("quality_flags", 3);

  if (topicIds && topicIds.length > 0) {
    query = query.in("topic_id", topicIds);
  }

  const { data, error } = await query.limit(limit);
  if (error || !data) {
    return [];
  }
  return data as ContentBankItem[];
}

/**
 * Saves downloaded items into Dexie `contentBankCache` for offline usage.
 */
export async function cacheBankItems(items: ContentBankItem[]): Promise<void> {
  if (items.length === 0) return;
  const now = new Date().toISOString();
  const records: ContentBankCacheRecord[] = items.map((item) => ({
    id: item.id,
    kind: item.kind,
    tool_name: item.tool_name,
    level: item.level,
    topic_id: item.topic_id,
    payload: item.payload,
    prompt_version: item.prompt_version,
    stem_hash: item.stem_hash,
    quality_flags: item.quality_flags,
    created_at: item.created_at,
    cachedAt: now,
  }));
  await db.contentBankCache.bulkPut(records);
}

/** Resolve the viewer's effective level and retain it for authenticated offline sessions. */
export async function getCoachBankLevel(userId: string | null): Promise<CEFRLevel | null> {
  if (!userId) {
    try {
      return (await getEffectiveLearnerLevelForViewer(null)).level;
    } catch {
      return null;
    }
  }

  const readCachedLevel = async (): Promise<CEFRLevel | null> => {
    try {
      const cached = await db.coachBankLevelCache.get(userId);
      return (cached?.level as CEFRLevel | undefined) ?? null;
    } catch {
      return null;
    }
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return readCachedLevel();
  }

  try {
    const resolution = await getEffectiveLearnerLevelForViewer(userId);
    if (resolution.source !== "unknown") {
      const record: CoachBankLevelCacheRecord = {
        userId,
        level: resolution.level,
        cachedAt: new Date().toISOString(),
      };
      await db.coachBankLevelCache.put(record);
      return resolution.level;
    }
  } catch {
    // A prior resolved level is still useful when profile lookup is unavailable.
  }

  return readCachedLevel();
}

/**
 * Reads bank items stored in local Dexie cache.
 */
export async function getCachedBankItems(
  level: string,
  topicIds?: string[],
): Promise<ContentBankItem[]> {
  const collection = db.contentBankCache.where("level").equals(level);
  const items = (await collection.toArray()).filter((item) => item.quality_flags < 3);
  if (!topicIds || topicIds.length === 0) {
    return items as ContentBankItem[];
  }
  const set = new Set(topicIds);
  return items.filter((item) => set.has(item.topic_id)) as ContentBankItem[];
}

/** Refresh locally cached IDs against the RLS-filtered server rows before online use. */
export async function revalidateCachedBankItems(
  level: string,
): Promise<{ ok: boolean; items: ContentBankItem[] }> {
  const cached = await getCachedBankItems(level);
  if (cached.length === 0) return { ok: true, items: [] };

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("content_bank_items")
      .select("id, kind, tool_name, level, topic_id, payload, prompt_version, stem_hash, quality_flags, created_at")
      .in("id", cached.map((item) => item.id))
      .lt("quality_flags", 3);
    if (error || !data) return { ok: false, items: [] };

    const safeItems = data as ContentBankItem[];
    const safeIds = new Set(safeItems.map((item) => item.id));
    const staleIds = cached.filter((item) => !safeIds.has(item.id)).map((item) => item.id);
    if (staleIds.length > 0) await db.contentBankCache.bulkDelete(staleIds);
    await cacheBankItems(safeItems);
    return { ok: true, items: safeItems };
  } catch {
    return { ok: false, items: [] };
  }
}
