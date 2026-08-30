"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ear, Mic, Waves, ArrowRight, X } from "@/components/icons";

interface Props {
  onSelectMinimalPairs: (contrastId?: string) => void;
}

const STORAGE_KEY = "sound_lab_hero_dismissed";

const CRITICAL_SPANISH_CONTRASTS = [
  { id: "vowel-i-i", phonemeA: "/iː/", phonemeB: "/ɪ/", words: "sheep / ship", label: "i tensa vs laxa" },
  { id: "vowel-ae-u", phonemeA: "/æ/", phonemeB: "/ʌ/", words: "cat / cut", label: "a frontal vs central" },
  { id: "consonant-th-voiced", phonemeA: "/θ/", phonemeB: "/ð/", words: "think / this", label: "th sorda vs sonora" },
  { id: "consonant-b-v", phonemeA: "/b/", phonemeB: "/v/", words: "berry / very", label: "b labial vs v dental" },
  { id: "consonant-sh-ch", phonemeA: "/ʃ/", phonemeB: "/tʃ/", words: "share / chair", label: "sh suave vs ch explosiva" },
];

export function EarAndVoiceHero({ onSelectMinimalPairs }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setIsDismissed(localStorage.getItem(STORAGE_KEY) === "true");
      }
    } catch {
      // Fallback if storage access is restricted
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Fallback
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Fallback
    }
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-caption text-xs text-fg-muted hover:text-fg rounded-md border border-border-subtle bg-surface-raised hover:bg-surface-sunken transition-colors"
          title="Mostrar guía de entrenamiento"
          aria-label="Mostrar guía de entrenamiento"
        >
          <Ear size={13} className="text-primary" />
          <span>Guía de entrenamiento</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-border-default bg-surface-raised p-3 shadow-sm mb-3">
      {/* Botón de cierre */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors"
        title="Ocultar guía"
        aria-label="Ocultar guía"
      >
        <X size={14} />
      </button>

      {/* Grid compacto de 1 fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pr-7">
        {/* Pilar 1: Escucha / Pares Mínimos */}
        <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-base p-2.5 transition-colors hover:border-primary/40">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <Ear size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-label text-xs font-bold text-fg truncate">1. Gimnasio del Oído</h3>
              <span className="font-caption text-[11px] text-fg-muted block truncate">Discriminación auditiva</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1 pt-1.5 border-t border-border-subtle">
            {CRITICAL_SPANISH_CONTRASTS.slice(0, 3).map((contrast) => (
              <button
                key={contrast.id}
                type="button"
                onClick={() => onSelectMinimalPairs(contrast.id)}
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-caption text-[11px] font-medium text-fg hover:bg-surface-sunken hover:text-primary transition-colors border border-border-subtle"
                title={`${contrast.label} (${contrast.words})`}
              >
                <span className="font-ipa text-primary">{contrast.phonemeA}</span>
                <span className="text-fg-subtle text-[9px]">vs</span>
                <span className="font-ipa text-primary">{contrast.phonemeB}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pilar 2: Articulación y Voz */}
        <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-base p-2.5 transition-colors hover:border-primary/40">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-warning-soft text-warning">
              <Mic size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-label text-xs font-bold text-fg truncate">2. Articulación y Voz</h3>
              <span className="font-caption text-[11px] text-fg-muted block truncate">Boca y lengua</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectMinimalPairs()}
            className="mt-2 inline-flex items-center justify-between gap-1 rounded-md bg-surface-raised px-2.5 py-1 text-caption text-[11px] font-semibold text-fg hover:bg-surface-sunken transition-colors border border-border-subtle"
          >
            <span>Ver Pares Mínimos</span>
            <ArrowRight size={13} className="text-primary" />
          </button>
        </div>

        {/* Pilar 3: Curvas de Entonación */}
        <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-base p-2.5 transition-colors hover:border-primary/40">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-success-soft text-success">
              <Waves size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-label text-xs font-bold text-fg truncate">3. Curvas de Entonación</h3>
              <span className="font-caption text-[11px] text-fg-muted block truncate">Melodía en vivo</span>
            </div>
          </div>

          <Link
            href="/practice/intonation"
            className="mt-2 inline-flex items-center justify-between gap-1 rounded-md bg-primary-wash px-2.5 py-1 text-caption text-[11px] font-semibold text-primary hover:bg-primary-soft transition-colors border border-primary/20"
          >
            <span>Probar Gráficas</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
