"use client";

import { useRef, useState } from "react";
import { Volume2, Mic, Pause } from "@/components/icons";
import { speak } from "@/lib/phoneme-practice/tts";
import { cn } from "@/lib/cn";

interface Props {
  targetWord?: string;
  userAudioUrl?: string | null;
  className?: string;
}

export function SelfPlaybackAudioBar({ targetWord, userAudioUrl, className }: Props) {
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNative = () => {
    if (!targetWord) return;
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingUser(false);
    }
    setIsPlayingNative(true);
    speak(targetWord, () => setIsPlayingNative(false));
  };

  const playUser = () => {
    if (!userAudioUrl) return;
    window.speechSynthesis?.cancel();
    setIsPlayingNative(false);

    if (isPlayingUser && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingUser(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(userAudioUrl);
      audioRef.current.onended = () => setIsPlayingUser(false);
      audioRef.current.onerror = () => setIsPlayingUser(false);
    } else {
      audioRef.current.src = userAudioUrl;
      audioRef.current.currentTime = 0;
    }

    setIsPlayingUser(true);
    audioRef.current.play().catch(() => setIsPlayingUser(false));
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-raised p-3.5 shadow-sm w-full max-w-md animate-in fade-in duration-200",
        className,
      )}
    >
      <div className="flex flex-col">
        <span className="font-caption text-xs font-semibold text-fg-muted uppercase tracking-wider">
          Comparación de Audio
        </span>
        <span className="text-body-sm font-medium text-fg">
          Escucha la diferencia
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Native Audio Button */}
        <button
          type="button"
          onClick={playNative}
          disabled={!targetWord}
          className={cn(
            "flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-3 py-2 text-caption font-semibold text-fg hover:bg-surface-sunken transition-colors",
            isPlayingNative && "border-primary text-primary animate-pulse",
          )}
          aria-label="Escuchar modelo nativo"
        >
          <Volume2 size={16} className={isPlayingNative ? "text-primary" : "text-fg-muted"} />
          <span>Nativo</span>
        </button>

        {/* User Recording Playback Button */}
        <button
          type="button"
          onClick={playUser}
          disabled={!userAudioUrl}
          className={cn(
            "flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-caption font-semibold transition-colors",
            userAudioUrl
              ? "border-primary/40 bg-primary-soft text-primary hover:bg-primary/20"
              : "border-border-subtle bg-surface-sunken text-fg-muted opacity-50 cursor-not-allowed",
            isPlayingUser && "border-primary ring-2 ring-primary/30",
          )}
          aria-label="Escuchar mi propia voz grabada"
        >
          {isPlayingUser ? <Pause size={16} /> : <Mic size={16} />}
          <span>Mi voz</span>
        </button>
      </div>
    </div>
  );
}
