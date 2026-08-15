"use client";

import Link from "next/link";
import { Ear, Mic, Waves, ArrowRight } from "@/components/icons";

interface Props {
  onSelectMinimalPairs: (contrastId?: string) => void;
  onOpenIPA: () => void;
}

const CRITICAL_SPANISH_CONTRASTS = [
  { id: "vowel-i-i", phonemeA: "/iː/", phonemeB: "/ɪ/", words: "sheep / ship", label: "i tensa vs laxa" },
  { id: "vowel-ae-u", phonemeA: "/æ/", phonemeB: "/ʌ/", words: "cat / cut", label: "a frontal vs central" },
  { id: "consonant-th-voiced", phonemeA: "/θ/", phonemeB: "/ð/", words: "think / this", label: "th sorda vs sonora" },
  { id: "consonant-b-v", phonemeA: "/b/", phonemeB: "/v/", words: "berry / very", label: "b labial vs v dental" },
  { id: "consonant-sh-ch", phonemeA: "/ʃ/", phonemeB: "/tʃ/", words: "share / chair", label: "sh suave vs ch explosiva" },
];

export function EarAndVoiceHero({ onSelectMinimalPairs, onOpenIPA }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-raised p-5 shadow-sm">
      {/* Top Banner Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <span className="font-kicker text-xs text-primary uppercase tracking-wider">
            Enfoque Acelerado · Oído & Voz
          </span>
          <h2 className="text-h3 font-bold text-fg mt-0.5">
            Entrenamiento de Escucha y Pronunciación
          </h2>
          <p className="text-body-sm text-fg-muted mt-0.5 text-pretty">
            Supera los 6 obstáculos fonéticos clave para hispanohablantes: afina la discriminación de sonidos parecidos y ajusta la colocación de la lengua.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenIPA}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border-default bg-surface-base px-3 py-2 text-caption font-semibold text-fg hover:bg-surface-sunken transition-colors"
        >
          Explorar fonemas IPA →
        </button>
      </div>

      {/* 3 Core Focus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Ear Training (Escucha) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-base p-4 transition-all hover:border-primary/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                <Ear size={18} aria-hidden />
              </span>
              <div>
                <h3 className="font-label text-sm font-bold text-fg">1. Gimnasio del Oído</h3>
                <span className="font-caption text-xs text-fg-muted">Discriminación auditiva</span>
              </div>
            </div>
            <p className="text-caption text-fg-muted text-pretty">
              Entrena tu oído para distinguir parejas mínimas como <em>sheep</em> vs <em>ship</em> antes de que tu cerebro las confunda.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle">
            {CRITICAL_SPANISH_CONTRASTS.slice(0, 3).map((contrast) => (
              <button
                key={contrast.id}
                type="button"
                onClick={() => onSelectMinimalPairs(contrast.id)}
                className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-1 font-caption text-xs font-medium text-fg hover:bg-surface-sunken hover:text-primary transition-colors border border-border-subtle"
                title={`${contrast.label} (${contrast.words})`}
              >
                <span className="font-ipa text-primary">{contrast.phonemeA}</span>
                <span className="text-fg-muted text-[10px]">vs</span>
                <span className="font-ipa text-primary">{contrast.phonemeB}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 2: Voice & Mouth Placement (Pronunciación) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-base p-4 transition-all hover:border-primary/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning-soft text-warning">
                <Mic size={18} aria-hidden />
              </span>
              <div>
                <h3 className="font-label text-sm font-bold text-fg">2. Articulación y Voz</h3>
                <span className="font-caption text-xs text-fg-muted">Colocación de boca y lengua</span>
              </div>
            </div>
            <p className="text-caption text-fg-muted text-pretty">
              Revisa los diagramas anatómicos animados para saber dónde colocar los labios y la lengua en cada sonido difícil.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectMinimalPairs()}
            className="mt-3 inline-flex items-center justify-between gap-1.5 rounded-lg bg-surface-raised px-3 py-2 text-caption font-semibold text-fg hover:bg-surface-sunken transition-colors border border-border-subtle"
          >
            <span>Ver Pares Mínimos</span>
            <ArrowRight size={14} className="text-primary" />
          </button>
        </div>

        {/* Card 3: Intonation & Pitch (Melodía y Ritmo) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-base p-4 transition-all hover:border-primary/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-success-soft text-success">
                <Waves size={18} aria-hidden />
              </span>
              <div>
                <h3 className="font-label text-sm font-bold text-fg">3. Curvas de Entonación</h3>
                <span className="font-caption text-xs text-fg-muted">Melodía en tiempo real</span>
              </div>
            </div>
            <p className="text-caption text-fg-muted text-pretty">
              Aprende cuándo subir el tono en preguntas ↗ y cuándo bajarlo en afirmaciones ↘ con visualización gráfica en vivo.
            </p>
          </div>

          <Link
            href="/practice/intonation"
            className="mt-3 inline-flex items-center justify-between gap-1.5 rounded-lg bg-primary-wash px-3 py-2 text-caption font-semibold text-primary hover:bg-primary-soft transition-colors border border-primary/20"
          >
            <span>Probar Gráficas de Tono</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
