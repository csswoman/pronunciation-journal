import type { GrammarContrastColumn } from "@/lib/courses/grammar-deck/types";

export default function GrammarContrastBlock({ columns }: { columns: GrammarContrastColumn[] }) {
  return (
    <div className="grammar-contrast">
      {columns.map((col) => (
        <div key={col.label} className="grammar-contrast__col">
          <div className="grammar-contrast__big">{col.label}</div>
          <div className="grammar-contrast__rule">{col.rule}</div>
          <div className="grammar-contrast__ex">
            {col.examples.map((ex, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {ex}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
