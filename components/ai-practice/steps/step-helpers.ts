export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDistractors(sentence: string, answer: string): string[] {
  const words = sentence
    .replace(/[",.!?]/g, "")
    .split(/\s+/)
    .filter((w) => w.toLowerCase() !== answer.toLowerCase() && w.length > 3);
  const unique = [...new Set(words)];
  return shuffle(unique).slice(0, 3);
}
