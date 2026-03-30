import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseUserId } from "@/lib/supabase/session";
import type { Json } from "@/lib/supabase/types";
import type { Entry } from "@/lib/types";

const AUDIO_BUCKET = "user-audio";
const STORAGE_PATH_PREFIX = "sb:";

const DIFFICULTY_TO_INT: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
const INT_TO_DIFFICULTY: Record<number, string> = { 1: "easy", 2: "medium", 3: "hard" };

type EntryRow = {
  id: string;
  word: string;
  ipa: string | null;
  audio_url: string | null;
  user_audio_url: string | null;
  notes: string | null;
  difficulty: number;
  tags: string[] | null;
  meanings: Json | null;
  created_at: string;
  updated_at: string | null;
};

function toStorageRef(path: string): string {
  return `${STORAGE_PATH_PREFIX}${path}`;
}

function fromStorageRef(value: string): string | null {
  if (!value.startsWith(STORAGE_PATH_PREFIX)) return null;
  return value.slice(STORAGE_PATH_PREFIX.length);
}

function getAudioExtensionFromSource(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("audio/mp4") || lower.includes("audio/m4a")) return "m4a";
  if (lower.includes("audio/mpeg") || lower.includes("audio/mp3")) return "mp3";
  if (lower.includes("audio/wav")) return "wav";
  return "webm";
}

function isLocalAudioValue(value: string): boolean {
  return value.startsWith("data:audio") || value.startsWith("blob:");
}

async function maybeUploadUserAudio(userId: string, entry: Entry): Promise<string | null> {
  const current = entry.userAudioUrl;
  if (!current) return null;

  // Ya almacenado en Supabase Storage
  if (fromStorageRef(current)) {
    return current;
  }

  // URL externa o preexistente: se conserva sin tocar
  if (!isLocalAudioValue(current)) {
    return current;
  }

  const response = await fetch(current);
  if (!response.ok) {
    throw new Error("No se pudo leer el audio local para subirlo a Supabase Storage.");
  }

  const blob = await response.blob();
  const ext = getAudioExtensionFromSource(current || blob.type);
  const path = `${userId}/${entry.id}.${ext}`;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type || `audio/${ext}`,
      cacheControl: "3600",
    });

  if (error) {
    console.error("uploadUserAudio:", error);
    throw error;
  }

  return toStorageRef(path);
}

async function resolveUserAudioUrl(value: string | null): Promise<string | undefined> {
  if (!value) return undefined;

  const storagePath = fromStorageRef(value);
  if (!storagePath) {
    return value;
  }

  const supabase = getSupabaseBrowserClient();
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl || undefined;
}

async function deleteAudioIfStored(value: string | null): Promise<void> {
  if (!value) return;
  const storagePath = fromStorageRef(value);
  if (!storagePath) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([storagePath]);
  if (error) {
    console.error("deleteAudioIfStored:", error);
    // No bloqueamos el borrado de la entrada por fallo de storage
  }
}

function entryToInsert(entry: Entry, userId: string, userAudioValue: string | null) {
  return {
    id: entry.id,
    user_id: userId,
    word: entry.word,
    ipa: entry.ipa ?? null,
    audio_url: entry.audioUrl ?? null,
    user_audio_url: userAudioValue,
    notes: entry.notes ?? null,
    difficulty: DIFFICULTY_TO_INT[entry.difficulty] ?? 1,
    tags: entry.tags ?? null,
    meanings: (entry.meanings ?? null) as Json | null,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt ?? null,
  };
}

async function rowToEntry(row: EntryRow): Promise<Entry> {
  return {
    id: row.id,
    word: row.word,
    ipa: row.ipa ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    userAudioUrl: await resolveUserAudioUrl(row.user_audio_url),
    notes: row.notes ?? undefined,
    difficulty: (INT_TO_DIFFICULTY[row.difficulty as unknown as number] ?? "medium") as Entry["difficulty"],
    tags: row.tags ?? undefined,
    meanings: (row.meanings as unknown as Entry["meanings"]) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function saveEntrySupabase(entry: Entry): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const userId = await getSupabaseUserId();
  const now = new Date().toISOString();

  const uploadedUserAudio = await maybeUploadUserAudio(userId, entry);
  const payload = {
    ...entryToInsert(
      {
        ...entry,
        updatedAt: now,
      },
      userId,
      uploadedUserAudio
    ),
    updated_at: now,
  };

  const { error } = await supabase.from("entries").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error("saveEntrySupabase:", error);
    throw error;
  }
}

export async function getEntriesSupabase(): Promise<Entry[]> {
  const supabase = getSupabaseBrowserClient();
  await getSupabaseUserId();

  const { data, error } = await supabase
    .from("entries")
    .select("id, word, ipa, audio_url, user_audio_url, notes, difficulty, tags, meanings, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getEntriesSupabase:", error);
    throw error;
  }

  return Promise.all((data ?? []).map((row) => rowToEntry(row as EntryRow)));
}

export async function deleteEntrySupabase(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await getSupabaseUserId();

  const { data: row, error: readError } = await supabase
    .from("entries")
    .select("user_audio_url")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("deleteEntrySupabase(read):", readError);
  }

  await deleteAudioIfStored((row as { user_audio_url: string | null } | null)?.user_audio_url ?? null);

  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) {
    console.error("deleteEntrySupabase:", error);
    throw error;
  }
}
