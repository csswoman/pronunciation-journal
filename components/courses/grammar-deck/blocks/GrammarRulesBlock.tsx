import type { ReactNode } from "react";
import type { GrammarRuleRow } from "@/lib/courses/grammar-deck/types";

function renderValue(row: GrammarRuleRow) {
  if (!row.highlights?.length) {
    return row.value;
  }

  let text = row.value;
  const nodes: ReactNode[] = [];
  for (const highlight of row.highlights) {
    const idx = text.indexOf(highlight);
    if (idx === -1) continue;
    if (idx > 0) nodes.push(text.slice(0, idx));
    nodes.push(<b key={highlight}>{highlight}</b>);
    text = text.slice(idx + highlight.length);
  }
  if (text) nodes.push(text);
  return nodes.length > 0 ? nodes : row.value;
}

export default function GrammarRulesBlock({ rows }: { rows: GrammarRuleRow[] }) {
  return (
    <div className="grammar-rules">
      {rows.map((row) => (
        <div key={row.key} className="grammar-rules__row">
          <span className="grammar-rules__key">{row.key}</span>
          <span className="grammar-rules__val">
            {renderValue(row)}
            {row.hint && (
              <>
                {" "}
                <span className="grammar-rules__hint">— {row.hint}</span>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
