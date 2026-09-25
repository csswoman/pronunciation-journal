"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Headphones, Pause, Play, RotateCcw, Volume2, VolumeX } from "@/components/icons";

// Planned structure:
// <AssessmentAudioPlayer>
//   <div className="assessment-audio">
//     <audio toggle button />
//     <seekbar controls + elapsed time />
//   </div>
//   {children}
//   <audio status feedback />
// </AssessmentAudioPlayer>

type AudioState = "ready" | "loading" | "playing" | "played" | "error";

interface AssessmentAudioPlayerProps {
  audioSrc: string;
  questionId: string;
  title?: string;
  onReadyChange?: (questionId: string, ready: boolean) => void;
  children?: React.ReactNode;
}

function formatAudioTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export function AssessmentAudioPlayer({
  audioSrc,
  questionId,
  title = "Diálogo corto",
  onReadyChange,
  children,
}: AssessmentAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [audioState, setAudioState] = useState<AudioState>("ready");
  const [currentTime, setCurrentTime] = useState(0);
  const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioPlaying = audioState === "loading" || audioState === "playing";

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // Ignorar si el entorno de pruebas no soporta pause()
      }
      audio.currentTime = 0;
    }
    setAudioState("ready");
    setCurrentTime(0);
    setSeekPreviewTime(null);
    const existingDuration = audio?.duration;
    if (Number.isFinite(existingDuration) && existingDuration && existingDuration > 0) {
      setDuration(existingDuration);
    } else {
      setDuration(0);
    }
    onReadyChange?.(questionId, false);
  }, [audioSrc, onReadyChange, questionId]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audioState === "played" || audio.ended) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setSeekPreviewTime(null);
    }
    setAudioState("loading");
    void audio.play().catch(() => {
      setAudioState("error");
      onReadyChange?.(questionId, false);
    });
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const getTimeFromClientX = (clientX: number): number => {
    if (!trackRef.current || duration <= 0) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const applySeek = (targetTime: number) => {
    if (!audioRef.current || duration <= 0 || !Number.isFinite(targetTime)) return;
    const safeTarget = Math.max(0, Math.min(targetTime, Math.max(0, duration - 0.1)));
    try {
      audioRef.current.currentTime = safeTarget;
      setCurrentTime(safeTarget);
      if (audioPlaying && audioRef.current.paused) {
        void audioRef.current.play().catch(() => {});
      }
    } catch {
      // Ignorar si el salto es temporalmente rechazado por el elemento audio
    }
  };

  const handleSkipBack = () => {
    if (!audioRef.current || duration <= 0) return;
    applySeek(Math.max(0, currentTime - 5));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignorar si el puntero no permite captura
    }
    const preview = getTimeFromClientX(event.clientX);
    setSeekPreviewTime(preview);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const preview = getTimeFromClientX(event.clientX);
    setSeekPreviewTime(preview);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignorar si ya se liberó el puntero
    }
    const target = getTimeFromClientX(event.clientX);
    setSeekPreviewTime(null);
    applySeek(target);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const step = 5;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      applySeek(Math.max(0, currentTime - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      applySeek(Math.min(duration, currentTime + step));
    }
  };

  const displayTime = seekPreviewTime ?? currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  return (
    <>
      <div className="assessment-audio">
        <button
          type="button"
          className="assessment-audio-toggle"
          aria-label={audioPlaying ? "Pausar audio" : audioState === "played" ? "Reproducir audio de nuevo" : "Reproducir audio"}
          aria-pressed={audioPlaying}
          onClick={handleTogglePlay}
        >
          {audioPlaying ? (
            <Pause size={18} className="assessment-audio-icon" aria-hidden />
          ) : (
            <Play size={18} className="assessment-audio-icon assessment-audio-icon--play" aria-hidden />
          )}
        </button>
        <div className="assessment-audio-content">
          <div className="assessment-audio-heading">
            <span className="assessment-audio-title">{title}</span>
            <div className="assessment-audio-actions">
              <button
                type="button"
                className="assessment-audio-btn-action"
                onClick={handleSkipBack}
                aria-label="Retroceder 5 segundos"
                title="Retroceder 5 segundos"
              >
                <RotateCcw size={13} aria-hidden />
                <span>-5s</span>
              </button>
              <button
                type="button"
                className="assessment-audio-btn-action"
                onClick={handleToggleMute}
                aria-label={isMuted ? "Activar sonido" : "Silenciar audio"}
                title={isMuted ? "Activar sonido" : "Silenciar audio"}
              >
                {isMuted ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
              </button>
              <span className="assessment-audio-time">
                {formatAudioTime(displayTime)} / {formatAudioTime(duration)}
              </span>
            </div>
          </div>
          <div
            ref={trackRef}
            className="assessment-audio-seekbar"
            role="slider"
            tabIndex={0}
            aria-label="Posición de reproducción"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(displayTime)}
            aria-valuetext={`${formatAudioTime(displayTime)} de ${formatAudioTime(duration)}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            <div className="assessment-audio-seekbar-track">
              <div
                className="assessment-audio-seekbar-fill"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="assessment-audio-seekbar-thumb"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          className="assessment-audio-media"
          preload="metadata"
          src={audioSrc}
          aria-label="Audio en inglés para la pregunta"
          onPlay={() => setAudioState("loading")}
          onPlaying={() => setAudioState((current) => current === "played" ? current : "playing")}
          onPause={() => setAudioState((current) => current === "played" || current === "error" ? current : "ready")}
          onLoadedMetadata={(event) => {
            const mediaDuration = event.currentTarget.duration;
            setDuration(Number.isFinite(mediaDuration) ? mediaDuration : 0);
          }}
          onDurationChange={(event) => {
            const mediaDuration = event.currentTarget.duration;
            if (Number.isFinite(mediaDuration) && mediaDuration > 0) {
              setDuration(mediaDuration);
            }
          }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onEnded={(event) => {
            const mediaDuration = event.currentTarget.duration;
            const finalDuration = Number.isFinite(mediaDuration) ? mediaDuration : duration;
            if (Number.isFinite(finalDuration)) setDuration(finalDuration);
            setAudioState("played");
            setCurrentTime(finalDuration);
            onReadyChange?.(questionId, true);
          }}
          onError={() => {
            setAudioState("error");
            onReadyChange?.(questionId, false);
          }}
        />
      </div>

      {children}

      <p className="assessment-audio-status" role={audioState === "error" ? "alert" : "status"}>
        {audioState === "error" ? (
          <><AlertCircle size={16} aria-hidden /> No se pudo cargar el audio. Tu respuesta anterior se conserva; reintenta para responder esta pregunta.</>
        ) : audioState === "played" ? (
          <><Check size={16} aria-hidden /> Audio reproducido. Ya puedes responder.</>
        ) : (
          <><Headphones size={16} aria-hidden /> Escucha el audio completo para habilitar las respuestas.</>
        )}
      </p>
      {audioState === "error" && (
        <button
          type="button"
          className="assessment-audio-retry"
          onClick={() => {
            setAudioState("ready");
            setCurrentTime(0);
            audioRef.current?.load();
          }}
        >
          Reintentar audio
        </button>
      )}
    </>
  );
}
