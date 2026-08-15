"use client";

import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "@/components/icons";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { useChunkOfDay } from "@/hooks/useChunkOfDay";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";
import { cn } from "@/lib/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "En Tracking";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar en Tracking";
}

export default function HomeChunkOfDayCard() {
  const { chunk, loading, isShuffled, shuffle } = useChunkOfDay();
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

  return (
    <div
      className="home-sidebar-card flex flex-col gap-2.5"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      {/* Header row: Kicker + Category + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span id="chunk-of-day-heading" className="font-label text-fg">
            Chunk del día
          </span>
          {chunk?.category ? (
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-mono-code text-[11px] font-medium text-fg-muted">
              {chunk.category}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {/* Shuffle / Otro chunk button */}
          <div className="group relative shrink-0">
            <button
              type="button"
              onClick={handleShuffle}
              aria-label="Sacar otro chunk"
              className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-sm text-fg-muted transition-colors hover:text-fg"
            >
              <RefreshCw
                size={16}
                strokeWidth={2}
                className={cn(
                  "transition-transform duration-300",
                  isRotating && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              Ver otro chunk
            </span>
          </div>

          {/* Favorite / Tracking button */}
          <div className="group relative shrink-0">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveState === "saving" || saveState === "saved"}
              aria-label={label}
              className={cn(
                "focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-sm transition-colors",
                saveState === "saved"
                  ? "text-error"
                  : "text-fg-muted hover:text-fg",
                saveState === "error" && "text-error"
              )}
            >
              <Heart
                size={16}
                fill={saveState === "saved" ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-2 py-1" aria-hidden>
          <div className="h-6 w-36 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-24 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
        </div>
      )}

      {/* Chunk Content */}
      {chunk && !loading && (
        <div className="animate-state-in flex flex-col gap-2" key={chunk.id}>
          {/* Main expression */}
          <p className="text-display-word min-w-0 font-semibold leading-tight text-fg tracking-tight">
            {chunk.chunk}
          </p>

          {/* IPA Transcription */}
          {chunk.ipa ? (
            <p
              className="font-ipa text-body-lg leading-snug text-fg-muted"
              lang="en-fonipa"
            >
              {formatIpaDisplay(chunk.ipa)}
            </p>
          ) : null}

          {/* Meaning / Translation in Spanish */}
          <p className="font-body-sm text-pretty text-fg-muted">
            {chunk.meaning}
          </p>

          {/* Example Box */}
          {chunk.example ? (
            <div className="mt-0.5 rounded-md border-l-2 border-primary bg-surface-sunken/40 px-3 py-2">
              <p className="font-body-sm italic text-fg">
                “{chunk.example}”
              </p>
              {chunk.example_translation ? (
                <p className="mt-0.5 font-caption text-fg-muted">
                  {chunk.example_translation}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Optional Tip */}
          {chunk.tip ? (
            <p className="font-caption text-fg-muted/85">
              <span className="font-medium text-fg">Tip:</span> {chunk.tip}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
