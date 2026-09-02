const POS_LABELS: Record<string, string> = {
  noun: "Sustantivo",
  verb: "Verbo",
  adjective: "Adjetivo",
  adverb: "Adverbio",
  pronoun: "Pronombre",
  preposition: "Preposición",
  conjunction: "Conjunción",
  interjection: "Interjección",
  phrase: "Frase",
  idiom: "Modismo",
};

export function formatPartOfSpeech(pos?: string): string | null {
  if (!pos) return null;
  const key = pos.toLowerCase().trim();
  return POS_LABELS[key] ?? pos;
}
