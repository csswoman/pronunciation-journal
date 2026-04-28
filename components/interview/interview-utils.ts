import type { ExerciseDifficulty, Level } from "./CandidateRecorder";

export const BASE_THRESHOLD: Record<Level, number> = { beginner: 42, intermediate: 62, advanced: 78 };
export const DIFF_MOD: Record<ExerciseDifficulty, number> = { guided: 0, challenge: 12 };
export const getThreshold = (l: Level, d: ExerciseDifficulty) => BASE_THRESHOLD[l] + DIFF_MOD[d];

export const primaryBtn: React.CSSProperties = {
  background: "var(--color-accent)",
  color: "var(--color-text-on-accent)",
};
export const ghostBtn: React.CSSProperties = {
  background: "var(--muted-bg)",
  color: "var(--muted-text)",
};
export const outlineBtn: React.CSSProperties = {
  border: "1px solid var(--line-divider)",
  color: "var(--muted-text)",
};

export function getEnVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speakPromise(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.lang = "en-US";
    const v = getEnVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}
