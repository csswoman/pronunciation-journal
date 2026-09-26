// Planned structure:
// <GrammarPairsBlock>
//   <PairsTable>
//     <TableHeader ("EVITA" | "MEJOR ASÍ")>
//     <TableBody (paired bad line with red strikethrough pill + good line with checkmark, note badge & audio speaker button)>
//   </PairsTable>
// </GrammarPairsBlock>

"use client";

import { Check, X } from "@/components/icons";
import type { GrammarPairLine } from "@/lib/courses/grammar-deck/types";
import SpeakButton from "../SpeakButton";

interface GrammarPairsBlockProps {
  lines: GrammarPairLine[];
}

export default function GrammarPairsBlock({ lines }: GrammarPairsBlockProps) {
  // Group alternating bad/good lines into pairs
  const pairs: { bad?: GrammarPairLine; good?: GrammarPairLine; pairIndex: number }[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const first = lines[i];
    const second = lines[i + 1];
    if (first?.variant === "bad" && second?.variant === "good") {
      pairs.push({ bad: first, good: second, pairIndex: i / 2 });
    } else {
      if (first?.variant === "bad") pairs.push({ bad: first, pairIndex: pairs.length });
      else pairs.push({ good: first, pairIndex: pairs.length });
      if (second) {
        if (second.variant === "bad") pairs.push({ bad: second, pairIndex: pairs.length });
        else pairs.push({ good: second, pairIndex: pairs.length });
      }
    }
  }

  return (
    <div className="grammar-vtable-wrap">
      <table className="grammar-vtable grammar-pairs-table">
        <thead>
          <tr>
            <th className="w-1/2">EVITA</th>
            <th className="w-1/2">MEJOR ASÍ</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, idx) => (
            <tr key={idx} className="grammar-pairs__tr">
              <td className="grammar-pairs__td-bad">
                {pair.bad && (
                  <span className="grammar-pairs__bad-pill">
                    <span className="grammar-pairs__bad-icon" aria-hidden>
                      <X size={12} strokeWidth={2.5} />
                    </span>
                    <span className="grammar-pairs__bad-text">{pair.bad.text}</span>
                  </span>
                )}
              </td>
              <td className="grammar-pairs__td-good">
                <div className="grammar-pairs__good-row">
                  <div className="grammar-pairs__good-main">
                    <span className="grammar-pairs__good-icon" aria-hidden>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <span className="grammar-pairs__good-text">{pair.good?.text}</span>
                    {pair.good?.note && (
                      <span className="grammar-pairs__note-badge">{pair.good.note}</span>
                    )}
                  </div>
                  {pair.good && (
                    <SpeakButton
                      text={pair.good.text}
                      size="sm"
                      className="flex-shrink-0"
                      label={`Escuchar: ${pair.good.text}`}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
