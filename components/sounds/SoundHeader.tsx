"use client";

import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  X,
} from "@/components/icons";
import type { PhonemeData } from "@/components/ipa/data";
import { SOUND_CLASS_SINGULAR_LABELS } from "@/lib/sounds/inventory";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const DURATION_LABEL: Record<"short" | "long", string> = {
  short: "Corta",
  long: "Larga",
};

export interface SoundHeaderProps {
  phoneme: PhonemeData;
  titleId?: string;
  descriptionId?: string;
  description: string;
  difficulty?: Difficulty;
  duration?: "short" | "long";
  exampleWord: string | null;
  isContinuing: boolean;
  isWeak: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClose?: () => void;
}

export function SoundHeader({
  phoneme,
  titleId,
  descriptionId,
  description,
  difficulty,
  duration,
  exampleWord,
  isContinuing,
  isWeak,
  isPlaying,
  onPlay,
  onPrev,
  onNext,
  onClose,
}: SoundHeaderProps) {
  return (
    <div className="ipa-chart__panel-hero sound-detail__hero">
      <header className="sound-detail__header">
        <div className="sound-detail__header-labels">
          <span className="ipa-chart__panel-tag">
            {SOUND_CLASS_SINGULAR_LABELS[phoneme.type]}
          </span>
          {difficulty ? (
            <span className="sound-detail__badge sound-detail__badge--difficulty">
              {DIFFICULTY_LABEL[difficulty]}
            </span>
          ) : null}
          {isContinuing ? (
            <span className="sound-detail__badge sound-detail__badge--primary">
              En curso
            </span>
          ) : null}
          {isWeak && !isContinuing ? (
            <span className="sound-detail__badge sound-detail__badge--warning">
              Repaso
            </span>
          ) : null}
        </div>

        <div className="sound-detail__actions">
          {onPrev ? (
            <button type="button" onClick={onPrev} aria-label="Fonema anterior">
              <ChevronLeft size={14} />
            </button>
          ) : null}
          {onNext ? (
            <button type="button" onClick={onNext} aria-label="Fonema siguiente">
              <ChevronRight size={14} />
            </button>
          ) : null}
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Cerrar detalle">
              <X size={16} />
            </button>
          ) : null}
        </div>
      </header>

        <div className="sound-detail__hero-row">
          <div>
            <h2 id={titleId} className="ipa-chart__panel-sym m-0">
              {phoneme.symbol}
            </h2>
          {exampleWord ? (
            <p className="sound-detail__example-word">{exampleWord}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onPlay}
          aria-label={isPlaying ? "Detener sonido" : "Reproducir sonido"}
          aria-pressed={isPlaying}
          className="ipa-chart__panel-play"
        >
          {isPlaying ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>
      </div>

      <p id={descriptionId} className="ipa-chart__panel-name">{description}</p>

      <div className="sound-detail__meta" aria-label="Datos del sonido">
        {duration ? (
          <span>
            <b>Duración</b> {DURATION_LABEL[duration]}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SoundProgress({ progress }: { progress: number }) {
  if (progress === 0) {
    return (
      <section
        className="sound-detail__progress-section sound-detail__progress-section--empty"
        aria-label="Estado de práctica"
      >
        <div className="sound-detail__section-head">
          <h3 className="ipa-chart__panel-sec m-0">Estado de práctica</h3>
          <span className="sound-detail__progress-empty">Sin practicar</span>
        </div>
      </section>
    );
  }

  return (
    <section className="sound-detail__progress-section" aria-label="Progreso de repaso espaciado">
      <div className="sound-detail__section-head">
        <h3 className="ipa-chart__panel-sec m-0">Progreso de repaso</h3>
        <span className="sound-detail__progress-value">{progress}%</span>
      </div>
      <div
        className="sound-detail__progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress}% de progreso de repaso espaciado`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
