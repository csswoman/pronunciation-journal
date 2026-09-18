"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus } from "@/components/icons";
import { LEVEL_NAMES, STUDY_TIPS, timeUntil } from "./study-utils";

interface StudyLeftPanelProps {
  imageUrl: string | null;
  imageLoading: boolean;
  word?: string;
  levelLabel: string | null;
  partOfSpeech?: string;
  tags?: string[] | null;
  nextReviewAt?: string | null;
  showTip: boolean;
  tipIndex: number;
  onToggleTip: () => void;
  onUpload: (file: File) => void;
  onRemoveImage: () => void;
}

export function StudyLeftPanel({
  imageUrl,
  imageLoading,
  word,
  levelLabel,
  nextReviewAt,
  showTip,
  tipIndex,
  onUpload,
  onRemoveImage,
}: StudyLeftPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="hidden lg:flex flex-col gap-6 w-56 xl:w-64 shrink-0 select-none">
      {/* REFERENCIA */}
      <div className="flex flex-col gap-2">
        <p className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
          Referencia
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        <div className="rounded-2xl border-2 border-dashed border-border-default aspect-[4/3] flex items-center justify-center overflow-hidden relative group bg-surface-raised hover:border-border-strong transition-colors">
          {imageUrl ? (
            <>
              <Image src={imageUrl} alt={word ?? ""} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-full bg-overlay-darker text-tiny font-semibold text-paper hover:bg-surface-raised"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="px-2.5 py-1 rounded-full bg-overlay-darker text-tiny font-semibold text-error hover:bg-surface-raised"
                >
                  Eliminar
                </button>
              </div>
            </>
          ) : imageLoading ? (
            <div className="flex flex-col items-center gap-2 text-fg-subtle">
              <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-sans text-caption font-medium">Subiendo…</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 w-full h-full justify-center text-fg-subtle hover:text-fg transition-colors"
            >
              <ImagePlus size={24} className="opacity-50" />
              <p className="font-sans text-caption font-semibold text-center">Añadir imagen</p>
            </button>
          )}
        </div>
      </div>

      {/* DETALLES */}
      <div className="flex flex-col gap-3">
        <p className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
          Detalles
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-caption font-medium text-fg-muted">Nivel</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-butter text-stone-900 text-caption font-bold border-none shadow-2xs">
              {levelLabel ?? "A1"} · {LEVEL_NAMES[levelLabel ?? "A1"] ?? "Principiante"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-caption font-medium text-fg-muted">Se repite</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-sunken text-fg-muted text-caption font-semibold border-none">
              {timeUntil(nextReviewAt)}
            </span>
          </div>
        </div>
      </div>

      {/* CONSEJO */}
      {showTip && (
        <div className="rounded-2xl p-4 border-none shadow-2xs bg-mint text-emerald-950">
          <p className="font-kicker text-caption font-extrabold uppercase tracking-wider mb-1 text-emerald-900">
            Consejo
          </p>
          <p className="font-sans text-caption leading-relaxed font-semibold text-emerald-950">
            {STUDY_TIPS[tipIndex % STUDY_TIPS.length]}
          </p>
        </div>
      )}
    </div>
  );
}

