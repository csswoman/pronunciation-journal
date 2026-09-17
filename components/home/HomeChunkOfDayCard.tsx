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
import { Bookmark, BookmarkCheck, RefreshCw, Volume2 } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { HeroTermExample } from "@/components/home/HeroTermExample";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { useChunkOfDay } from "@/hooks/useChunkOfDay";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveTrackedItem } from "@/lib/tracking/queries";
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
      {text}
      <span className="text-ink-secondary font-normal" aria-hidden>…</span>
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
  const { user } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setSaveState("idle");
  }, [chunk?.id]);

  async function handleSave() {
    if (!chunk || !user || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      await saveTrackedItem({ userId: user.id, kind: "phrase", ref: `chunk:${chunk.id}`, title: chunk.chunk, payload: { text: chunk.chunk, context: `${chunk.meaning} · Example: "${chunk.example}"`, source: "chunk_catalog", chunkId: chunk.id } });
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
    <PastelCard
      tone="butter"
      className="relative flex min-h-[220px] h-full flex-col justify-between gap-5 overflow-hidden motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      {/* Header: Frase del día + Categoría */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center justify-center shrink-0 rounded-full bg-ink px-4 py-1.5 text-paper">
          <span id="chunk-of-day-heading" className="whitespace-nowrap font-sans text-caption font-bold tracking-tight text-paper">
            Frase del día
          </span>
        </div>
        {categoryLabel ? (
          <span
            className="pastel-card-chip truncate max-w-[62%] rounded-full px-3.5 py-1.5 font-sans text-caption font-medium text-ink-muted lowercase whitespace-nowrap"
            title={categoryLabel}
          >
            {categoryLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="pastel-card-chip h-8 w-3/4 animate-pulse rounded-xl" />
          <div className="pastel-card-chip h-4 w-1/3 animate-pulse rounded-lg" />
          <div className="pastel-card-chip h-4 w-full animate-pulse rounded-lg" />
          <div className="pastel-card-chip mt-2 h-4 w-5/6 animate-pulse rounded-lg" />
        </div>
      )}

      {chunk && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-3" key={chunk.id}>
          {/* Grupo de título y pronunciación */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "font-heading font-extrabold text-ink leading-[1.2] break-words tracking-tight",
                getHeroScale(chunk.chunk)
              )}
            >
              <OpenEndedText value={chunk.chunk} />
            </span>
            <button
              type="button"
              onClick={() => speakText(chunk.chunk)}
              className="shrink-0 rounded-full bg-ink p-3 text-paper hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-ring shadow-sm"
              aria-label={`Escuchar pronunciación de ${chunk.chunk}`}
            >
              <Volume2 size={18} aria-hidden />
            </button>
          </div>

          {chunk.ipa ? (
            <span
              className="font-ipa text-body-md font-bold text-ink-secondary tracking-wide -mt-1"
              lang="en-fonipa"
            >
              {formatIpaDisplay(chunk.ipa)}
            </span>
          ) : null}

          {/* Traducción de la frase */}
          <p className="font-body-md text-ink font-semibold leading-relaxed">
            <OpenEndedText value={chunk.meaning} />
          </p>

          {/* Ejemplo estilo card con kicker y audio */}
          {example ? (
            <HeroTermExample example={example} resetKey={chunk.id} />
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar (Bookmark) + Otra (Refresh icon) */}
      <div className="relative z-1 flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-2 border-ink px-5 py-2 font-sans text-body-sm font-bold text-ink transition-all cursor-pointer",
            saveState === "saved"
              ? "bg-ink text-paper border-ink cursor-default"
              : "bg-transparent text-ink hover:bg-ink hover:text-paper",
            saveState === "error" && "text-error border-error"
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
          title="Otra frase"
          className="focus-ring group relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-transparent text-ink transition-all hover:bg-ink/10 hover:scale-105 active:scale-95 cursor-pointer select-none"
        >
          <RefreshCw
            size={18}
            className={cn(
              "transition-transform duration-500",
              isRotating ? "rotate-[360deg] opacity-60" : "group-hover:rotate-45"
            )}
            aria-hidden
          />
          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 rounded-full bg-ink/15 text-ink px-3 py-1 font-sans text-caption font-semibold whitespace-nowrap shadow-xs">
            Otra frase
          </span>
        </button>
      </div>
    </PastelCard>
  );
}
