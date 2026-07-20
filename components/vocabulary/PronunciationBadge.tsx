"use client";

import { useRef, useState } from "react";
import { Volume2 } from "@/components/icons";

interface PronunciationBadgeProps {
  ipa: string;
  audioUrl?: string;
  onClick?: () => void;
}

export default function PronunciationBadge({ ipa, audioUrl, onClick }: PronunciationBadgeProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = () => {
    if (audioUrl) {
      const audio = audioRef.current ?? new Audio(audioUrl);
      audioRef.current = audio;
      audio.currentTime = 0;
      setIsPlaying(true);
      void audio.play().catch(() => {
        setIsPlaying(false);
        onClick?.();
      });
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      return;
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center rounded-md border font-mono text-base leading-tight px-2.5 py-1 bg-[color-mix(in_oklch,var(--surface-sunken)_40%,transparent)] text-fg-muted cursor-pointer transition-all duration-150 hover-border-primary"
      style={{
        borderColor: isPlaying ? "var(--primary)" : "var(--line-divider)",
        opacity: isPlaying ? 0.82 : 1,
      }}
      aria-label={`Play pronunciation for ${ipa}`}
      title="Play pronunciation"
    >
      <Volume2 size={14} />
      <span className="ml-1.5">{ipa}</span>
    </button>
  );
}
