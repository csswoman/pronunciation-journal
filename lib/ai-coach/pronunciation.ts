import { pickUSPhonetic, stripIPASlashes } from "@/lib/ai-practice/modes/pronunciation";

export const DEFAULT_PHRASES = [
  "I would appreciate the opportunity",
  "Could you please repeat that?",
  "I'm looking forward to working with you",
  "That sounds like a great idea",
  "I completely understand your point",
  "Would you mind helping me with this?",
  "Let me think about that for a moment",
  "I really enjoyed our conversation today",
  "The weather has been wonderful lately",
  "She works really hard every single day",
  "They were thrilled with the results",
  "We should probably leave a little earlier",
  "I thought the presentation went really well",
  "He finally finished the project last Thursday",
  "This is exactly what I was looking for",
  "I appreciate you taking the time to explain",
  "Would you rather meet in the morning?",
  "The third Thursday of the month works for me",
  "I've been practicing every day this week",
  "Nothing worthwhile ever comes without effort",
];

export const BATCH_SIZE = 5;
const LS_QUEUE = "pronunciation_queue";
const LS_MASTERED = "pronunciation_mastered";
const LS_SEEN = "pronunciation_seen";

export const PHONEME_TIPS: Record<string, string> = { DH: "Vibrate your tongue lightly between your teeth — it should buzz.", TH: "Touch the tip of your tongue to the back of your upper teeth. No buzzing.", R: "Curl your tongue back slightly, don't touch the roof of your mouth.", W: "Round your lips before you start. Like blowing out a candle.", V: "Your top teeth lightly touch your bottom lip. Make it vibrate.", F: "Same as V but no vibration — just air through the teeth and lip.", NG: "Let the sound finish in the back of your throat. No hard 'g'.", SH: "Push your lips forward, tongue up behind your teeth. Shhhh.", ZH: "Like SH but with your voice on — like the 's' in 'measure'.", AE: "Open your mouth wide and spread your lips. Like the 'a' in 'cat'.", IY: "Stretch your lips into a smile. The vowel is long and tense.", UW: "Round your lips tightly. The vowel is long and pushed forward.", ER: "Curl your tongue slightly back as you say it — the American 'r' vowel.", AH: "Relax your jaw fully. Short, open, like a sigh.", AO: "Round your lips slightly. Longer and more open than 'AH'." };

export function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function loadQueue(): string[] { try { return JSON.parse(localStorage.getItem(LS_QUEUE) ?? "[]"); } catch { return []; } }
export function saveQueue(q: string[]) { localStorage.setItem(LS_QUEUE, JSON.stringify(q)); }
export function loadMastered(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(LS_MASTERED) ?? "[]")); } catch { return new Set(); } }
export function saveMastered(s: Set<string>) { localStorage.setItem(LS_MASTERED, JSON.stringify([...s])); }
export function loadSeen(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(LS_SEEN) ?? "[]")); } catch { return new Set(); } }
export function saveSeen(s: Set<string>) { localStorage.setItem(LS_SEEN, JSON.stringify([...s])); }
export function pickBatch(exclude: Set<string>): string[] { return shuffle(DEFAULT_PHRASES.filter((p) => !exclude.has(p))).slice(0, BATCH_SIZE); }
export function initQueue(): string[] { const stored = loadQueue(); if (stored.length > 0) return stored; const batch = pickBatch(loadMastered()); saveQueue(batch); return batch; }

export async function fetchWordIPA(word: string): Promise<string | null> {
  try { const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`); if (!res.ok) return null; const data = await res.json(); if (!Array.isArray(data) || !data[0]) return null; const phonetics = (data[0] as { phonetics?: Array<{ text?: string; audio?: string }> }).phonetics ?? []; const raw = pickUSPhonetic(phonetics); return raw ? stripIPASlashes(raw) : null; } catch { return null; }
}

export function speakPhrase(phrase: string, rate = 0.85) { if (typeof window === "undefined" || !("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(phrase); u.lang = "en-US"; u.rate = rate; window.speechSynthesis.speak(u); }
