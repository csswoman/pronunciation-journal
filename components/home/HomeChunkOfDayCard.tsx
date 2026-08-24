"use client";

// Planned structure:
// <HomeChunkOfDayCard>
//   header: title + category chip + shuffle/heart
//   quote block (phrase + IPA) — card left border + IPA in --c-chunks
//   meaning + example + tip
// </HomeChunkOfDayCard>

import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "@/components/icons";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { useChunkOfDay } from "@/hooks/useChunkOfDay";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";
import { cn } from "@/lib/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "Guardada";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar frase";
}

/** Phrase focus — IPA carries domain color; card stays neutral. */
export default function HomeChunkOfDayCard() {
  const { chunk, loading, shuffle } = useChunkOfDay();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);

  const [lang, setLang] = useState<"es" | "en">("es");

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
      className="home-sidebar-card flex flex-col gap-3"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span id="chunk-of-day-heading" className="font-label text-fg">
            Frase del día
          </span>
          {chunk?.category ? (
            <span className="rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono-code text-[11px] font-medium text-fg-muted">
              {chunk.category}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="group relative">
            <button
              type="button"
              onClick={handleShuffle}
              aria-label="Sacar otra frase"
              aria-describedby="chunk-shuffle-tooltip"
              className="focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-sm text-fg-muted transition-colors hover:text-fg"
            >
              <RefreshCw
                size={16}
                strokeWidth={2}
                className={cn(
                  "transition-transform duration-300",
                  isRotating && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            <span
              id="chunk-shuffle-tooltip"
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              Ver otra frase
            </span>
          </div>

          <div className="group relative">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveState === "saving" || saveState === "saved"}
              aria-label={label}
              aria-describedby="chunk-save-tooltip"
              className={cn(
                "focus-ring inline-flex min-h-8 min-w-8 items-center justify-center rounded-sm transition-colors",
                saveState === "saved"
                  ? "text-error"
                  : "text-fg-muted hover:text-fg",
                saveState === "error" && "text-error",
              )}
            >
              <Heart
                size={16}
                fill={saveState === "saved" ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
            <span
              id="chunk-save-tooltip"
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-3/4 animate-pulse rounded-md bg-surface-sunken" />
            <div className="mt-1.5 h-4 w-1/2 animate-pulse rounded bg-surface-sunken" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-20 animate-pulse rounded bg-surface-sunken" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-sunken" />
          </div>
        </div>
      )}

      {chunk && !loading && (
        <div className="animate-state-in flex flex-col gap-3" key={chunk.id}>
          <div className="home-chunk-quote">
            <p className="home-chunk-quote__phrase">{chunk.chunk}</p>
            {chunk.ipa ? (
              <p
                className="mt-1.5 font-ipa text-body-sm leading-snug text-chunks"
                lang="en-fonipa"
              >
                {formatIpaDisplay(chunk.ipa)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            {chunk.example ? (
              <div className="flex items-center justify-between gap-2">
                <span
                  key={`lang-label-${lang}`}
                  className="animate-state-in font-caption font-medium text-fg-muted"
                >
                  {lang === "es" ? "Significado" : "Ejemplo"}
                </span>
                <div
                  className="inline-flex rounded-full border border-border-subtle bg-surface-sunken p-0.5"
                  role="group"
                  aria-label="Idioma"
                >
                  <button
                    type="button"
                    onClick={() => setLang("es")}
                    aria-pressed={lang === "es"}
                    className={cn(
                      "press-feedback focus-ring rounded-full px-2 py-0.5 font-mono-code text-[11px] font-medium transition-colors",
                      lang === "es"
                        ? "bg-surface-raised text-fg shadow-xs"
                        : "text-fg-muted hover:text-fg",
                    )}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    aria-pressed={lang === "en"}
                    className={cn(
                      "press-feedback focus-ring rounded-full px-2 py-0.5 font-mono-code text-[11px] font-medium transition-colors",
                      lang === "en"
                        ? "bg-surface-raised text-fg shadow-xs"
                        : "text-fg-muted hover:text-fg",
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>
            ) : null}

            {lang === "es" || !chunk.example ? (
              <p
                key={`lang-body-${lang}`}
                className="animate-state-in font-body-sm text-pretty text-fg"
              >
                {chunk.meaning}
              </p>
            ) : (
              <p
                key={`lang-body-${lang}`}
                className="animate-state-in font-body-sm italic text-fg-muted"
              >
                “{chunk.example}”
              </p>
            )}
          </div>

          {chunk.tip ? (
            <p className="font-caption text-fg-muted">
              <span className="font-medium text-fg">Tip:</span> {chunk.tip}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
