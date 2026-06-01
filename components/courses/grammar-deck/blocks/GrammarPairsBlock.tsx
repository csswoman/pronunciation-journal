import { X, Check } from "lucide-react";
import type { GrammarPairLine } from "@/lib/courses/grammar-deck/types";
import { cn } from "@/lib/cn";

export default function GrammarPairsBlock({ lines }: { lines: GrammarPairLine[] }) {
  return (
    <div className="grammar-pairs">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "grammar-pair",
            line.variant === "bad" ? "grammar-pair--bad" : "grammar-pair--good"
          )}
        >
          <span className="grammar-pair__mk" aria-hidden>
            {line.variant === "bad" ? (
              <X size={12} strokeWidth={2.5} />
            ) : (
              <Check size={12} strokeWidth={2.5} />
            )}
          </span>
          <span className="grammar-pair__text">
            {line.text}
            {line.note && <span className="grammar-pair__note">{line.note}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
