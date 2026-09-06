"use client";

// Planned structure:
// <WordCardWidget>           — flat editorial block (not a card; static content)
//   <WordHead />             — tappable: word hero + IPA (Andika) + speak affordance
//   meaning                  — Spanish definition, body text
//   <WordExample />          — filete-marked example + iconOnly ListenButton
// </WordCardWidget>

import type { WordCardArgs } from "@/lib/ai-practice/tools/registry";
import { Volume2 } from "@/components/icons";
import { ListenButton } from "@/components/ui/ListenButton";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { speakText } from "@/lib/speech/synthesis";

interface Props {
  args: WordCardArgs;
}

export default function WordCardWidget({ args }: Props) {
  const ipa = formatIpaDisplay(args.ipa);
  const example = args.example?.trim().replace(/^["“”]+|["“”]+$/g, "");

  return (
    <div className="flex flex-col gap-4">
      <WordHead word={args.word} ipa={ipa} />

      <p className="text-body-md leading-relaxed text-fg">{args.meaning}</p>

      {example && <WordExample text={example} />}
    </div>
  );
}

function WordHead({ word, ipa }: { word: string; ipa: string }) {
  return (
    <button
      type="button"
      onClick={() => speakText(word)}
      aria-label={`Escuchar la pronunciación de ${word}`}
      className="group/word focus-ring -mx-1.5 flex flex-col gap-1 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-sunken/60 motion-reduce:transition-none cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-display-word font-bold leading-tight text-fg transition-colors group-hover/word:text-primary motion-reduce:transition-none">
          {word}
        </span>
        <span className="mt-1 shrink-0 rounded-full border border-border-subtle bg-surface-sunken p-1.5 text-fg-muted transition-colors group-hover/word:border-primary/40 group-hover/word:bg-primary-soft group-hover/word:text-primary motion-reduce:transition-none">
          <Volume2 size={15} aria-hidden />
        </span>
      </div>
      {ipa && (
        <span className="font-ipa text-body-md font-medium text-fg-muted" lang="en-fonipa">
          {ipa}
        </span>
      )}
    </button>
  );
}

function WordExample({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-label text-caption font-semibold text-fg-muted">Ejemplo</span>
      <div className="flex items-start justify-between gap-3 border-l-2 border-border-default py-0.5 pl-3.5">
        <p className="text-body-md italic leading-relaxed text-fg-muted">{text}</p>
        <ListenButton
          iconOnly
          aria-label="Escuchar el ejemplo"
          className="-mt-1 shrink-0 self-start"
          onPlay={() => speakText(text)}
        />
      </div>
    </div>
  );
}
