"use client";

// Planned structure:
// <HomeChunkOfDayCard>
//   header: "Frase del día" + category chip
//   content:
//     phrase hero title
//     IPA line + speak button
//     meaning in Spanish
//     example block (filete, audio button, translation toggle)
//   footer:
//     Guardar button (Bookmark) + Otra button (Refresh)
// </HomeChunkOfDayCard>

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, MessageCircle, RefreshCw } from "@/components/icons";
import { ListenButton } from "@/components/ui/ListenButton";
import { HeroTermExample } from "@/components/home/HeroTermExample";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { useChunkOfDay } from "@/hooks/useChunkOfDay";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";
import { speakText } from "@/lib/speech/synthesis";
import { formatChunkCategory } from "@/lib/chunk-of-day/categories";
import { chunkExample } from "@/lib/chunk-of-day/types";
import { splitOpenEnded } from "@/lib/chunk-of-day/open-ended";
import { getHeroScale } from "@/lib/home/hero-scale";
import { cn } from "@/lib/cn";

/**
 * Renders a term/translation, drawing any trailing "..." as an explicit muted
 * gap instead of literal ellipsis (which reads as CSS truncation).
 */
function OpenEndedText({ value }: { value: string }) {
  const { text, hasGap } = splitOpenEnded(value);
  if (!hasGap) return <>{value}</>;
  return (
    <>
      {text}{" "}
      <span
        aria-hidden
        className="inline-block w-4 translate-y-[-0.15em] border-b border-border-default align-middle"
      />
      <span className="sr-only">(continúa)</span>
    </>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "Guardada";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar frase";
}

/** Phrase focus — card matches editorial visual language and clear hierarchy. */
export default function HomeChunkOfDayCard() {
  const { chunk, loading, shuffle } = useChunkOfDay();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setSaveState("idle");
  }, [chunk?.id]);

  async function handleSave() {
    if (!chunk || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const entry = await quickAddWord({
        text: chunk.chunk,
        context: `${chunk.meaning} · Example: "${chunk.example}"`,
        source: "manual",
      });
      await toggleFavorite(entry.id, true);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function handleShuffle() {
    setIsRotating(true);
    shuffle();
    setTimeout(() => setIsRotating(false), 350);
  }

  const label = saveLabel(saveState);
  const categoryLabel = formatChunkCategory(chunk?.category);
  const example = chunk ? chunkExample(chunk) : null;

  return (
    <div
      className="home-sidebar-card relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-xl border border-border-default border-l-[3px] border-l-primary/75 bg-surface-raised p-4 shadow-xs motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      {/* Header: Frase del día + Categoría */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <MessageCircle size={14} className="text-primary" aria-hidden />
          <span id="chunk-of-day-heading" className="whitespace-nowrap font-label text-caption font-semibold text-fg">
            Frase del día
          </span>
        </div>
        {categoryLabel ? (
          <span
            className="truncate max-w-[62%] rounded-full border border-primary/25 bg-primary-soft/60 px-2.5 py-0.5 font-sans text-caption font-medium text-primary whitespace-nowrap"
            title={categoryLabel}
          >
            {categoryLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="h-7 w-3/4 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface-sunken" />
        </div>
      )}

      {chunk && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-3" key={chunk.id}>
          {/* Grupo de título y pronunciación */}
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                "font-heading font-bold text-fg leading-snug break-words tracking-tight",
                getHeroScale(chunk.chunk)
              )}
            >
              <OpenEndedText value={chunk.chunk} />
            </p>

            <div className="flex items-center gap-2">
              {chunk.ipa ? (
                <span
                  className="font-ipa text-body-md font-medium text-fg-muted"
                  lang="en-fonipa"
                >
                  {formatIpaDisplay(chunk.ipa)}
                </span>
              ) : null}
              <ListenButton
                iconOnly
                aria-label="Escuchar pronunciación"
                onPlay={() => speakText(chunk.chunk)}
              />
            </div>
          </div>

          {/* Traducción de la frase */}
          <p className="font-body-md text-fg leading-relaxed">
            <OpenEndedText value={chunk.meaning} />
          </p>

          {/* Ejemplo con filete lateral y botón de audio */}
          {example ? (
            <HeroTermExample example={example} resetKey={chunk.id} />
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar (Bookmark) + Otra (Refresh icon) */}
      <div className="relative z-1 flex items-center gap-2 border-t border-border-subtle/50 pt-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 py-1.5 font-body-sm font-medium transition-colors cursor-pointer",
            saveState === "saved"
              ? "border-accent/40 bg-accent/10 text-accent font-medium cursor-default"
              : "border-border-default bg-surface-base text-fg hover:bg-surface-sunken",
            saveState === "error" && "border-error/40 text-error"
          )}
        >
          {saveState === "saved" ? (
            <BookmarkCheck size={16} aria-hidden />
          ) : (
            <Bookmark size={16} aria-hidden />
          )}
          <span>{saveState === "saved" ? "Guardada" : "Guardar"}</span>
        </button>

        <button
          type="button"
          onClick={handleShuffle}
          aria-label="Ver otra frase"
          className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border-default bg-surface-base text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg cursor-pointer"
        >
          <RefreshCw
            size={15}
            className={cn(
              "transition-transform duration-300",
              isRotating && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
