"use client";

import { Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { LexiconSearchHit } from "@/lib/lexicon/types";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

// Subcomponent structure:
// <LexiconWordDetail>
//   <div (Card Container)>
//     <div (Word Header & IPA Badge)>
//     <p (Translation)>
//     <p (Definition)>
//     <div (Action Buttons)>
//   </div>
// </LexiconWordDetail>

interface LexiconWordDetailProps {
  selected: LexiconSearchHit;
  onPlay: () => void;
  onAddWord?: (text: string) => void;
  onOpenCategory: (hit: LexiconSearchHit) => void;
}

export function LexiconWordDetail({
  selected,
  onPlay,
  onAddWord,
  onOpenCategory,
}: LexiconWordDetailProps) {
  return (
    <div
      className="mt-4 space-y-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 sm:p-6 shadow-sm transition-all duration-200"
      role="region"
      aria-label="Detalle de palabra"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="text-h3 font-bold text-fg tracking-tight">{selected.word}</span>
        {selected.ipa ? (
          <span className="font-ipa text-body font-medium text-primary bg-primary-soft/60 border border-primary/20 px-2 py-0.5 rounded-md">
            {formatIpaDisplay(selected.ipa)}
          </span>
        ) : (
          <span className="text-caption font-mono text-fg-subtle">{selected.pos}</span>
        )}
        <span className="ml-auto rounded-full bg-surface-sunken border border-border-subtle text-caption text-fg-muted px-2.5 py-0.5">
          {selected.categoryName}
        </span>
        {selected.ipa && (
          <span
            className="rounded-full bg-primary-soft text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
            title="Alfabeto Fonético Internacional"
          >
            IPA
          </span>
        )}
      </div>

      {selected.translation ? (
        <p className="text-body-sm font-semibold text-fg-muted">{selected.translation}</p>
      ) : null}

      <p className="text-body-sm text-fg leading-relaxed">{selected.definition}</p>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle/50">
        <Button size="sm" icon={<Volume2 size={15} />} onClick={onPlay}>
          Escuchar
        </Button>
        {onAddWord ? (
          <Button variant="secondary" size="sm" onClick={() => onAddWord(selected.word)}>
            Añadir a mis palabras
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => onOpenCategory(selected)}>
          Ver categoría
        </Button>
      </div>
    </div>
  );
}

