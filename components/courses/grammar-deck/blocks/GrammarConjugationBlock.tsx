import type { GrammarConjugationRow } from "@/lib/courses/grammar-deck/types";

export default function GrammarConjugationBlock({ rows }: { rows: GrammarConjugationRow[] }) {
  return (
    <div className="grammar-conj">
      {rows.flatMap((row) => [
        <div key={`${row.pronoun}-p`} className="grammar-conj__pron">
          {row.pronoun}
        </div>,
        <div key={`${row.pronoun}-f`} className="grammar-conj__form">
          <b>{row.form}</b>
          {row.hint && <small className="grammar-conj__hint">{row.hint}</small>}
        </div>,
      ])}
    </div>
  );
}
