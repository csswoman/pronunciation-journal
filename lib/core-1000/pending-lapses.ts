const PENDING_LAPSES_KEY = "core1000:pending-lapses";

export type PendingLapseEntry = [wordId: string, quality: number];

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function loadPendingLapses(): Map<string, number> {
  const storage = getStorage();
  if (!storage) return new Map();

  const raw = storage.getItem(PENDING_LAPSES_KEY);
  if (!raw) return new Map();

  try {
    return new Map(JSON.parse(raw) as PendingLapseEntry[]);
  } catch {
    storage.removeItem(PENDING_LAPSES_KEY);
    return new Map();
  }
}

export function savePendingLapses(entries: Map<string, number>): void {
  const storage = getStorage();
  if (!storage) return;

  const serialized = Array.from(entries.entries());
  if (serialized.length === 0) {
    storage.removeItem(PENDING_LAPSES_KEY);
    return;
  }

  storage.setItem(PENDING_LAPSES_KEY, JSON.stringify(serialized));
}
