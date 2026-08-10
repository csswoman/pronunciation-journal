// Curated exceptions for written production clozes.
//
// A written blank must have one intended lexical answer. These sentences stay
// available to listening and other sentence-based activities, where the audio
// supplies the target, but are skipped by ClozeCard. Keep the match exact so
// an editorial replacement automatically becomes eligible for review.
const EXCLUDED_BY_WORD: Readonly<Record<string, readonly string[]>> = {
  program: ["The TV program will start soon."],
}

export function isExcludedFromProductionCloze(word: string, sentence: string): boolean {
  return EXCLUDED_BY_WORD[word.toLowerCase()]?.includes(sentence) ?? false
}
