interface DictionaryDefinition {
  definition?: string;
  example?: string;
}

export interface DictionaryMeaning {
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
}

export interface SelectedDictionarySense {
  partOfSpeech: string;
  definition: string;
  example: string;
}

/** Pedagogical POS first — brand/proper nouns often lead Wiktionary entries. */
const PREFERRED_POS = new Set(["adjective", "verb", "adverb"]);

function usableDefinition(
  item: DictionaryDefinition | undefined,
): string | null {
  const text = item?.definition?.trim();
  return text ? text : null;
}

function pickDefinition(
  meaning: DictionaryMeaning,
  requireExample: boolean,
): SelectedDictionarySense | null {
  const definitions = meaning.definitions ?? [];
  const item = requireExample
    ? definitions.find((d) => usableDefinition(d) && d.example?.trim())
    : definitions.find((d) => usableDefinition(d));
  const definition = usableDefinition(item);
  if (!definition || !item) return null;
  return {
    partOfSpeech: meaning.partOfSpeech?.trim() || "",
    definition,
    example: item.example?.trim() ?? "",
  };
}

/**
 * Pick one sense for Word of Day display.
 * Prefers adjective/verb/adverb over noun; only returns real definition text.
 */
export function selectDictionarySense(
  meanings: DictionaryMeaning[] | undefined,
): SelectedDictionarySense | null {
  if (!meanings?.length) return null;

  const preferred = meanings.filter((m) =>
    PREFERRED_POS.has((m.partOfSpeech ?? "").toLowerCase()),
  );
  const others = meanings.filter(
    (m) => !PREFERRED_POS.has((m.partOfSpeech ?? "").toLowerCase()),
  );

  // POS beats "has example": adj/verb/adverb without example win over noun+example.
  for (const group of [preferred, others]) {
    for (const requireExample of [true, false]) {
      for (const meaning of group) {
        const sense = pickDefinition(meaning, requireExample);
        if (sense) return sense;
      }
    }
  }
  return null;
}
