import { Entry } from "./types";

const STORAGE_KEY = "pronunciation-journal-entries";

export function saveEntry(entry: Entry): void {
  const entries = getEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new entry
    entries.push(entry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntries(): Entry[] {
  if (typeof window === "undefined") {
    return [];
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

export function deleteEntry(id: string): void {
  const entries = getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

