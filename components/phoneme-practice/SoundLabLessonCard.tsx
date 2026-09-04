"use client";

import Link from "next/link";
import { Play } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { MASTERY_DISPLAY_THRESHOLD } from "@/lib/phoneme-practice/mastery-pct";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { cn } from "@/lib/cn";
import { getCanonicalSound } from "@/lib/sounds/inventory";
import { getSoundCardTag } from "@/lib/sounds/spanish-contrast";

// Structure:
// <SoundLabLessonCard>
//   <TopTagSlot>
//     <Badge />
//   </TopTagSlot>
//   <IpaHero />
//   <AnchorWord />
//   <ProgressBlock />
//   <ExampleButtons />
// </SoundLabLessonCard>

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  isContinuing?: boolean;
  staggerIndex?: number;
  onSelect?: () => void;
}

export function SoundLabLessonCard({
  lesson,
  progressPct,
  isWeak,
  isContinuing,
  staggerIndex = 0,
  onSelect,
}: Props) {
  const { id, title, words, href } = lesson;
  const { speaking, speak } = useSpeakWord();
  const ipa = ipaFromLessonTitle(title);
  const topTag = ipa ? getSoundCardTag(ipa) : null;
  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
  const canonicalExamples = getCanonicalSound(ipa ?? "")?.examples ?? [];
  const examples = [...new Set(
    (canonicalExamples.length > 0 ? canonicalExamples : words.map((w) => w.word))
      .filter(Boolean),
  )].slice(0, 2);
  const heroWord = examples[0];
  const delayMs = Math.min(staggerIndex * 20, 300);

  const isDone =
    progressPct !== undefined && progressPct >= MASTERY_DISPLAY_THRESHOLD;
  const isInProgress =
    progressPct !== undefined &&
    progressPct > 0 &&
    progressPct < MASTERY_DISPLAY_THRESHOLD;

  const content = (
    <>
      {/* Etiqueta superior con shade semántico para alinear todos los fonemas */}
      <div className="h-6 mb-2 flex items-center">
        {isContinuing ? (
          <Badge label="En curso" variant="default" size="sm" dot />
        ) : isWeak ? (
          <Badge label="Repaso" variant="warning" size="sm" dot />
        ) : topTag ? (
          <Badge
            label={topTag.label}
            variant={topTag.type === "new" ? "error" : "warning"}
            size="sm"
            dot={topTag.type === "new"}
          />
        ) : isDone ? (
          <Badge label="Dominado" variant="success" size="sm" />
        ) : null}
      </div>

      {/* Símbolo IPA con identidad de marca y presencia visual */}
      {ipa && (
        <span className="font-ipa text-display-ipa font-bold tracking-tight text-primary leading-tight mb-1 block transition-transform duration-200 group-hover:scale-105 origin-left">
          {ipa}
        </span>
      )}

      {/* Palabra Ancla */}
      {heroWord && (
        <span className="text-body text-fg-muted block mb-5 leading-normal font-normal">
          {heroWord}
        </span>
      )}

      {/* Indicador de Progreso */}
      <div className="mt-auto pt-1 mb-4">
        {isInProgress ? (
          <div className="flex flex-col gap-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPct}% dominado`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPct ?? 0))}%` }}
              />
            </div>
            <span className="text-caption font-medium text-primary">
              {progressPct}% dominado
            </span>
          </div>
        ) : isDone ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full rounded-full bg-success" />
            <span className="text-caption font-medium text-success">
              Dominado
            </span>
          </div>
        ) : (
          <span className="text-caption font-normal text-fg-subtle">
            Sin practicar
          </span>
        )}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "sound-lab__card group relative flex flex-col justify-between rounded-2xl border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong focus-within:border-primary active:scale-[0.99]",
        isContinuing && "sound-lab__card--continuing border-primary/60 ring-1 ring-primary/20 shadow-sm",
        isWeak && !isContinuing && "sound-lab__card--weak border-warning/40 shadow-xs",
        isDone && !isContinuing && !isWeak && "sound-lab__card--done border-success/40 shadow-xs",
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="flex flex-col text-left outline-none flex-1 focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label={`Ver detalles de ${[ipa, heroWord, topTag?.label].filter(Boolean).join(" — ")}`}
        >
          {content}
        </button>
      ) : (
        <Link
          href={linkHref}
          className="flex flex-col no-underline outline-none flex-1 focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          aria-label={[ipa, heroWord, topTag?.label].filter(Boolean).join(" — ")}
        >
          {content}
        </Link>
      )}

      {/* Botones de ejemplos de audio con acabado pill interactivo */}
      {examples.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-border-subtle">
          {examples.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speak(word);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-sunken/80 px-3 min-h-[32px] max-w-full text-caption font-medium text-fg hover:border-border-strong hover:bg-surface-raised active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary",
                speaking === word && "border-primary bg-primary-soft text-primary shadow-xs",
              )}
              aria-label={`Pronunciar ${word}`}
            >
              <Play
                size={11}
                className={cn(
                  "fill-current shrink-0 text-fg-subtle transition-colors",
                  speaking === word && "text-primary fill-primary animate-pulse",
                )}
                aria-hidden
              />
              <span className="truncate max-w-[110px]">{word}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
