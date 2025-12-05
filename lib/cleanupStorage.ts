import { Entry } from "./types";

const STORAGE_KEY = "pronunciation-journal-entries";

/**
 * Clean up old blob URLs from stored entries
 * This should be run once to fix entries saved with temporary blob URLs
 */
export function cleanupBlobUrls(): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const entries: Entry[] = JSON.parse(stored);
    let hasChanges = false;

    const cleanedEntries = entries.map(entry => {
      if (entry.userAudioUrl && entry.userAudioUrl.startsWith('blob:')) {
        hasChanges = true;
        return {
          ...entry,
          userAudioUrl: undefined, // Remove invalid blob URL
        };
      }
      return entry;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedEntries));
      console.log("Cleaned up blob URLs from storage");
    }
  } catch (error) {
    console.error("Error cleaning up storage:", error);
  }
}

