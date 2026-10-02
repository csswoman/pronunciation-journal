/**
 * Best-effort part of speech from an English dictionary-style definition.
 * `word_bank` has no POS column, so we read it off the definition's shape:
 * "to succeed…" → verb, "a person who…" → noun. Anything else → undefined
 * (better no badge than a wrong one).
 */
export function inferPartOfSpeech(meaning?: string | null): string | undefined {
  const text = meaning?.trim().toLowerCase()
  if (!text) return undefined
  if (/^to\s+\w+/.test(text)) return 'verb'
  if (/^(a|an|the)\s+\w+/.test(text)) return 'noun'
  return undefined
}
