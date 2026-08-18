const RECENT_KEY = "ej-lexicon-recent";
const MAX_RECENT = 4;

export function loadLexiconRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveLexiconRecent(word: string): string[] {
  const prev = loadLexiconRecent().filter((w) => w.toLowerCase() !== word.toLowerCase());
  const next = [word, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
