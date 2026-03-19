import { Entry } from "./types";
import { isSupabaseConfigured } from "./supabase/env";
import {
  saveEntrySupabase,
  getEntriesSupabase,
  deleteEntrySupabase,
} from "./storage/supabase";

const STORAGE_KEY = "pronunciation-journal-entries";

function useSupabase(): boolean {
  return typeof window !== "undefined" && isSupabaseConfigured();
}

export async function saveEntry(entry: Entry): Promise<void> {
  if (useSupabase()) {
    await saveEntrySupabase(entry);
    return;
  }

  const entries = await getEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };
  } else {
    entries.push(entry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getEntries(): Promise<Entry[]> {
  if (typeof window === "undefined") {
    return [];
  }

  if (useSupabase()) {
    try {
      return await getEntriesSupabase();
    } catch (e) {
      console.error("Supabase getEntries falló, usando localStorage:", e);
      // fallback a datos locales si la nube falla
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function deleteEntry(id: string): Promise<void> {
  if (useSupabase()) {
    await deleteEntrySupabase(id);
    return;
  }

  const entries = await getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
