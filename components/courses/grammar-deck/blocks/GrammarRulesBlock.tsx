// Planned structure:
// <GrammarRulesBlock>
//   <GrammarRulesTable> (when formatted as vocabulary/verbs table)
//     <TableHeader />
//     <TableRow />
//   </GrammarRulesTable>
//   <GrammarRulesList> (standard rule key-value list)
// </GrammarRulesBlock>

import type { ReactNode } from "react";
import type { GrammarRuleRow } from "@/lib/courses/grammar-deck/types";
import SpeakButton from "../SpeakButton";

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
  const isTableLayout = rows.some((r) => r.value.includes(" · ") || r.ipa);

  if (isTableLayout) {
    return (
      <div className="grammar-vtable-wrap">
        <table className="grammar-vtable">
          <thead>
            <tr>
              <th scope="col">VERBO</th>
              <th scope="col">SIGNIFICADO</th>
              <th scope="col">ASÍ LO VERÁS</th>
              <th scope="col" className="sr-only">Pronunciación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const dotIndex = row.value.indexOf(" · ");
              const hasSplit = !row.hint && dotIndex !== -1;
              const gloss = hasSplit ? row.value.slice(0, dotIndex) : row.value;
              const exampleText = hasSplit ? row.value.slice(dotIndex + 3) : row.value;
              const audioText = hasSplit ? exampleText : row.key;

              return (
                <tr key={row.key || i}>
                  <td className="grammar-vtable__verbo">
                    <span className="grammar-vtable__key-text">{row.key}</span>
                    {row.ipa && <span className="grammar-vtable__ipa font-ipa">{row.ipa}</span>}
                  </td>
                  <td className="grammar-vtable__gloss">{gloss}</td>
                  <td className="grammar-vtable__example">
                    {hasSplit ? renderValue({ ...row, value: exampleText }) : renderValue(row)}
                  </td>
                  <td className="grammar-vtable__action">
                    <SpeakButton text={audioText} size="sm" label={`Escuchar ${row.key}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grammar-rules">
      {rows.map((row) => {
        const dotIndex = row.value.indexOf(" · ");
        const hasSplit = !row.hint && dotIndex !== -1;
        const gloss = hasSplit ? row.value.slice(0, dotIndex) : null;
        const exampleText = hasSplit ? row.value.slice(dotIndex + 3) : row.value;

        return (
          <div key={row.key} className="grammar-rules__row">
            <span className="grammar-rules__key">
              {row.key}
              {row.ipa && <span className="grammar-rules__ipa font-ipa ml-1.5 opacity-60">({row.ipa})</span>}
            </span>
            <span className="grammar-rules__val">
              {hasSplit ? (
                <span className="grammar-rules__content">
                  <span className="grammar-rules__gloss">{gloss}</span>
                  <span className="grammar-rules__phrase">
                    {renderValue({ ...row, value: exampleText })}
                  </span>
                </span>
              ) : (
                renderValue(row)
              )}
              {row.hint && (
                <span className="grammar-rules__hint">— {row.hint}</span>
              )}
            </span>
            <SpeakButton text={row.key} size="sm" className="ml-auto" />
          </div>
        );
      })}
    </div>
  );
}

