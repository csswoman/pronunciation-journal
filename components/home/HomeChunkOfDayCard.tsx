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
import { Bookmark, BookmarkCheck, MessageCircle, RefreshCw, Volume2 } from "@/components/icons";
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
    <div
      className="home-sidebar-card relative flex min-h-[220px] h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-sky p-5 text-ink motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      {/* Header: Frase del día + Categoría */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <MessageCircle size={16} className="text-ink" aria-hidden />
          <span id="chunk-of-day-heading" className="whitespace-nowrap font-label text-caption font-bold text-ink">
            Frase del día
          </span>
        </div>
        {categoryLabel ? (
          <span
            className="truncate max-w-[62%] rounded-full bg-sky-deep px-3 py-1 font-sans text-caption font-medium text-ink lowercase whitespace-nowrap"
            title={categoryLabel}
          >
            {categoryLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="h-7 w-3/4 animate-pulse rounded bg-sky-deep" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-sky-deep" />
          <div className="h-4 w-full animate-pulse rounded bg-sky-deep" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-sky-deep" />
        </div>
      )}

      {chunk && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-3" key={chunk.id}>
          {/* Grupo de título y pronunciación tocable */}
          <button
            type="button"
            onClick={() => speakText(chunk.chunk)}
            className="group/listen focus-ring -mx-1.5 flex flex-col gap-1 rounded-xl p-1.5 text-left transition-colors hover:bg-sky-deep cursor-pointer"
            aria-label={`Escuchar pronunciación de ${chunk.chunk}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "font-heading font-bold text-ink leading-snug break-words tracking-tight",
                  getHeroScale(chunk.chunk)
                )}
              >
                <OpenEndedText value={chunk.chunk} />
              </span>
              <div className="shrink-0 rounded-full bg-sky-deep p-2 text-ink">
                <Volume2 size={16} aria-hidden />
              </div>
            </div>

            {chunk.ipa ? (
              <span
                className="font-ipa text-body-md font-medium text-ink-secondary tracking-wide"
                lang="en-fonipa"
              >
                {formatIpaDisplay(chunk.ipa)}
              </span>
            ) : null}
          </button>

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
      <div className="relative z-1 flex items-center gap-2 border-t border-ink/15 pt-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 font-body-sm font-medium transition-colors cursor-pointer",
            saveState === "saved"
              ? "bg-ink text-paper cursor-default"
              : "bg-sky-deep text-ink hover:bg-ink hover:text-paper",
            saveState === "error" && "text-error"
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
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-sky-deep px-3 text-ink transition-colors hover:bg-ink hover:text-paper cursor-pointer"
        >
          <RefreshCw
            size={14}
            className={cn(
              "transition-transform duration-300",
              isRotating && "rotate-180"
            )}
            aria-hidden
          />
          <span className="font-body-sm font-medium">Otra</span>
        </button>
      </div>
    </div>
  );
}
