"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Headphones, Pause, Play } from "@/components/icons";

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
  const [audioState, setAudioState] = useState<AudioState>("ready");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioPlaying = audioState === "loading" || audioState === "playing";

  useEffect(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setAudioState("ready");
    setCurrentTime(0);
    setDuration(0);
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
    }
    setAudioState("loading");
    void audio.play().catch(() => {
      setAudioState("error");
      onReadyChange?.(questionId, false);
    });
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (duration || 0);
    if (audioRef.current && Number.isFinite(targetTime)) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const step = 5;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const nextTime = Math.max(0, currentTime - step);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextTime = Math.min(duration, currentTime + step);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

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
            <span>{title}</span>
            <span>{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
          </div>
          <div
            className="assessment-audio-seekbar"
            role="slider"
            tabIndex={0}
            aria-label="Posición de reproducción"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatAudioTime(currentTime)} de ${formatAudioTime(duration)}`}
            onClick={handleSeek}
            onKeyDown={handleKeyDown}
          >
            <div
              className="assessment-audio-seekbar-fill"
              style={{ width: `${progressPercent}%` }}
            />
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
