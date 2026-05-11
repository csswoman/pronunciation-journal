"use client";

import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";

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
      className="inline-flex items-center rounded-full border text-fg-muted transition-all duration-150"
      style={{
        fontSize: "16px",
        lineHeight: 1.2,
        fontFamily: "var(--font-mono)",
        padding: "4px 10px",
        borderRadius: "var(--radius-md)",
        background: "color-mix(in oklch, var(--surface-sunken) 40%, transparent)",
        borderColor: isPlaying ? "var(--primary)" : "var(--line-divider)",
        opacity: isPlaying ? 0.82 : 1,
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isPlaying ? "var(--primary)" : "var(--line-divider)";
      }}
      aria-label={`Play pronunciation for ${ipa}`}
      title="Play pronunciation"
    >
      <Volume2 size={14} />
      <span style={{ marginLeft: "6px" }}>{ipa}</span>
    </button>
  );
}
