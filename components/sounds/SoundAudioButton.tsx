"use client";

import { ListenButton } from "@/components/ui/ListenButton";
import { cn } from "@/lib/cn";

export function SoundAudioButton({
  word,
  speaking,
  onSpeak,
  className,
}: {
  word: string;
  speaking: boolean;
  onSpeak: (word: string) => void;
  className?: string;
}) {
  return (
    <ListenButton
      label={word}
      aria-label={speaking ? `Detener pronunciación ${word}` : `Pronunciar ${word}`}
      aria-pressed={speaking}
      onPlay={() => onSpeak(word)}
      className={cn(
        "sound-detail__audio-button",
        speaking && "sound-detail__audio-button--speaking",
        className,
      )}
    />
  );
}
