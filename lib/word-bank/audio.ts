interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

interface DictionaryMeaning {
  partOfSpeech?: string;
  definitions?: Array<{ definition: string }>;
}

interface DictionaryEntry {
  word?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: DictionaryMeaning[];
}

const DICTIONARY_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const TIMEOUT_MS = 5000;

function makeAbortSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface AudioFetchResult {
  url: string | null;
  hasAudio: boolean | null;
}

export async function getWordAudio(word: string): Promise<AudioFetchResult> {
  if (!word || word.trim().length === 0) {
    return { url: null, hasAudio: false };
  }

  const cleanWord = word.trim().toLowerCase();

  try {
    const signal = makeAbortSignal(TIMEOUT_MS);
    const url = `${DICTIONARY_API_BASE}/${encodeURIComponent(cleanWord)}`;

    const response = await fetch(url, { signal, mode: "cors" });

    if (!response.ok) {
      if (response.status === 404) {
        return { url: null, hasAudio: false };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as DictionaryEntry[];
    if (!Array.isArray(data) || data.length === 0) {
      return { url: null, hasAudio: false };
    }

    const entry = data[0];
    if (!entry.phonetics || !Array.isArray(entry.phonetics)) {
      return { url: null, hasAudio: false };
    }

    for (const phonetic of entry.phonetics) {
      if (phonetic.audio && typeof phonetic.audio === "string") {
        const audioUrl = phonetic.audio.trim();
        if (isValidHttpUrl(audioUrl)) {
          return { url: audioUrl, hasAudio: true };
        }
      }
    }

    return { url: null, hasAudio: false };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[word-bank] Audio fetch timeout for "${word}"`);
      return { url: null, hasAudio: null };
    }
    console.warn(`[word-bank] Failed to fetch audio for "${word}":`, err);
    return { url: null, hasAudio: null };
  }
}
