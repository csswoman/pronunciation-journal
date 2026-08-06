// Browser-only, lazy lexical check for semantic typo detection. Keeping the
// CMU dictionary behind import() avoids putting its 4.7 MB source in the
// Essential Words route until a near-miss actually needs classification.
type CmuDictionary = Record<string, string>

let dictionaryPromise: Promise<CmuDictionary> | null = null

function dictionary(): Promise<CmuDictionary> {
  dictionaryPromise ??= import('cmu-pronouncing-dictionary').then((module) =>
    (module.dictionary ?? module) as CmuDictionary,
  )
  return dictionaryPromise
}

export async function isValidEnglishWord(word: string): Promise<boolean> {
  const normalized = word.toLowerCase().replace(/[^a-z']/g, '')
  if (!normalized) return false
  const entries = await dictionary()
  return Boolean(entries[normalized] ?? entries[normalized.replace(/'/g, '')])
}
