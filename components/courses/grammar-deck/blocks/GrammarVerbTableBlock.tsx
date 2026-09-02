import type { GrammarCardBlock } from "@/lib/courses/grammar-deck/types";

type Block = Extract<GrammarCardBlock, { type: "verb-table" }>;

export default function GrammarVerbTableBlock({ headers, rows }: Block) {
  return (
    <div className="overflow-x-auto max-w-full rounded-xl">
      <table className="grammar-vtable">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={j === 3 ? "grammar-vtable__es" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
