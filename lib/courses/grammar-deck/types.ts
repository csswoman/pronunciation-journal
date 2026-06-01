/** Study deck card model (grammar cards UI — content wired later). */

export interface GrammarDeckMeta {
  eyebrow: string;
  title: string;
  /** Italic emphasis in title, e.g. "esencial" */
  titleEmphasis?: string;
  /** CEFR-style can-do statement shown to motivate the lesson. */
  goal?: string;
}

export interface GrammarConjugationRow {
  pronoun: string;
  form: string;
  hint?: string;
}

export interface GrammarContrastColumn {
  label: string;
  rule: string;
  examples: string[];
}

export interface GrammarPairLine {
  variant: "bad" | "good";
  text: string;
  note?: string;
}

export interface GrammarRuleRow {
  key: string;
  /** Plain text; wrap important bits in `highlights` */
  value: string;
  highlights?: string[];
  hint?: string;
}

export interface GrammarPronExample {
  text: string;
  ipa?: string;
  es?: string;
}

export type GrammarCardBlock =
  | { type: "conjugation"; rows: GrammarConjugationRow[] }
  | {
      type: "verb-table";
      headers: [string, string, string, string];
      rows: [string, string, string, string][];
    }
  | { type: "contrast"; columns: GrammarContrastColumn[] }
  | { type: "pairs"; lines: GrammarPairLine[] }
  | { type: "rules"; rows: GrammarRuleRow[] }
  | {
      type: "pronunciation";
      sound: string;
      focus?: string[];
      examples: GrammarPronExample[];
      note?: string;
    };

export interface GrammarStudyCardData {
  id: string;
  index: number;
  tag: string;
  title: string;
  /** Words/phrases to render in editorial italic inside the title */
  titleItalic?: string[];
  lede: string;
  blocks: GrammarCardBlock[];
  tip?: { label: string; body: string };
}

export interface GrammarRelatedLink {
  slug: string;
  label: string;
}

export interface GrammarQuizQuestion {
  q: string;
  options: string[];
  /** 0-based index of the correct option. */
  answer: number;
  explain?: string;
}

export interface GrammarStudyDeckData {
  meta: GrammarDeckMeta;
  /** Target IPA sounds for the Sound Lab handoff. */
  sounds?: string[];
  related?: GrammarRelatedLink[];
  quiz?: GrammarQuizQuestion[];
  cards: GrammarStudyCardData[];
}
