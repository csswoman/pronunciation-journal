import { createHash } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CacheRow = {
  transcript: string;
  updated_at: string;
};

type TranscriptionCacheOptions<TExtra extends Record<string, unknown>> = {
  table: "stt_transcription_cache" | "sentence_transcription_cache";
  ttlMs: number;
  maxEntries: number;
  buildExtraRow?: (extra: TExtra) => Record<string, unknown>;
};

type CacheEntry = {
  transcript: string;
  createdAt: number;
};

export function buildTranscriptionCacheKey(parts: Array<string | undefined>): string {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(part ?? "");
    hash.update("|");
  }
  return hash.digest("hex");
}

export function createTranscriptionCache<TExtra extends Record<string, unknown> = Record<string, never>>({
  table,
  ttlMs,
  maxEntries,
  buildExtraRow,
}: TranscriptionCacheOptions<TExtra>) {
  const l1 = new Map<string, CacheEntry>();

  function getL1(key: string): string | null {
    const cached = l1.get(key);
    if (!cached) return null;
    if (Date.now() - cached.createdAt > ttlMs) {
      l1.delete(key);
      return null;
    }
    return cached.transcript;
  }

  function setL1(key: string, transcript: string): void {
    if (l1.size >= maxEntries) {
      const oldest = l1.keys().next().value;
      if (oldest) l1.delete(oldest);
    }
    l1.set(key, { transcript, createdAt: Date.now() });
  }

  async function getL2(userId: string, key: string): Promise<string | null> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from(table)
        .select("transcript, updated_at")
        .eq("user_id", userId)
        .eq("cache_key", key)
        .maybeSingle() as { data: CacheRow | null; error: unknown };

      if (error || !data) return null;

      const ageMs = Date.now() - new Date(data.updated_at).getTime();
      if (Number.isFinite(ageMs) && ageMs > ttlMs) {
        await supabase.from(table).delete().eq("user_id", userId).eq("cache_key", key);
        return null;
      }

      return data.transcript;
    } catch {
      return null;
    }
  }

  async function setL2(
    userId: string,
    key: string,
    transcript: string,
    mimeType: string,
    payloadSize: number,
    extra: TExtra
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.from(table).upsert(
        {
          user_id: userId,
          cache_key: key,
          mime_type: mimeType,
          transcript,
          payload_size: payloadSize,
          updated_at: new Date().toISOString(),
          ...(buildExtraRow ? buildExtraRow(extra) : {}),
        },
        { onConflict: "user_id,cache_key" }
      );
    } catch {
      // Cache writes are non-critical.
    }
  }

  return {
    getL1,
    setL1,
    getL2,
    setL2,
  };
}
