/** Study deck card model (grammar cards UI — content wired later). */

export interface GrammarDeckMeta {
  eyebrow: string;
  title: string;
  /** Italic emphasis in title, e.g. "esencial" */
  titleEmphasis?: string;
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

export type GrammarCardBlock =
  | { type: "conjugation"; rows: GrammarConjugationRow[] }
  | {
      type: "verb-table";
      headers: [string, string, string, string];
      rows: [string, string, string, string][];
    }
  | { type: "contrast"; columns: GrammarContrastColumn[] }
  | { type: "pairs"; lines: GrammarPairLine[] }
  | { type: "rules"; rows: GrammarRuleRow[] };

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

export interface GrammarStudyDeckData {
  meta: GrammarDeckMeta;
  cards: GrammarStudyCardData[];
}
