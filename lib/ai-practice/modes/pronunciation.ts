export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

/**
 * Picks the US English IPA from a dictionaryapi.dev phonetics array.
 * Priority: explicit US audio > non-UK audio > any with text.
 */
export function pickUSPhonetic(phonetics: DictionaryPhonetic[]): string | null {
  const withText = phonetics.filter(p => p.text);
  if (!withText.length) return null;

  const us = withText.find(p => p.audio?.includes("-us"));
  if (us) return us.text!;

  const notUK = withText.find(p => !p.audio?.includes("-uk"));
  if (notUK) return notUK.text!;

  return withText[0].text!;
}

export function stripIPASlashes(raw: string): string {
  return raw.replace(/^\//, "").replace(/\/$/, "");
}
