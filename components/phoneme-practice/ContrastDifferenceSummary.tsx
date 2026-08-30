"use client";

import type { ArticulationContrast } from "@/lib/pronunciation/articulation-contrast";
import { ArrowRight, Lightbulb } from "@/components/icons";

// Sub-components: summary sentence, per-dimension A→B rows
interface Props {
  contrast: ArticulationContrast;
  phonemeA: string;
  phonemeB: string;
}

/** Names the articulatory difference explicitly instead of leaving the learner
 *  to spot it by comparing two near-identical diagrams. */
export function ContrastDifferenceSummary({ contrast, phonemeA, phonemeB }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-surface-base p-3">
      <p className="font-label text-xs font-semibold text-primary flex items-center gap-1.5 mb-1.5">
        <Lightbulb size={14} className="text-primary shrink-0" aria-hidden />
        <span>Qué cambia realmente</span>
      </p>

      <p className="text-body-sm text-fg text-pretty">{contrast.summaryEs}</p>

      {contrast.differences.length > 0 && (
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {contrast.differences.map((diff) => (
            <li
              key={diff.dimension}
              className="flex items-center gap-2 rounded-md bg-surface-sunken px-2.5 py-1.5 font-caption text-[11px]"
            >
              <span className="font-semibold text-fg-subtle shrink-0">{diff.labelEs}</span>
              <span className="flex items-center gap-1.5 text-fg-muted min-w-0">
                <span className="truncate">{diff.valueA}</span>
                <ArrowRight size={11} className="text-primary shrink-0" aria-hidden />
                <span className="truncate text-fg font-medium">{diff.valueB}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only">
        Comparación entre {phonemeA} y {phonemeB}.
      </p>
    </div>
  );
}
