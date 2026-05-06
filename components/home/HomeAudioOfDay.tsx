"use client";

import { useState, useRef } from "react";
import { Play, Pause, Headphones } from "lucide-react";
import Card from "@/components/layout/Card";

interface HomeAudioOfDayProps {
  title?: string;
  source?: string;
  duration?: string;
  level?: string;
  audioUrl?: string;
}

export default function HomeAudioOfDay({
  title = '"How language shapes thought"',
  source = "BBC",
  duration = "4:32",
  level = "Intermediate",
  audioUrl,
}: HomeAudioOfDayProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioUrl) return;
    if (!audioRef.current) audioRef.current = new Audio(audioUrl);
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const BAR_HEIGHTS = [8, 14, 20, 16, 26, 20, 30, 24, 18, 28, 22, 34, 28, 20, 14, 22, 30, 24, 18, 12, 20, 26, 18, 14, 10];

  return (
    <Card variant="compact" className="gap-5">
      <div className="flex items-center gap-2">
        <Headphones size={14} className="text-[var(--primary)]" />
        <span className="text-tiny font-bold tracking-widest text-[var(--primary)] uppercase">
          Audio of the day
        </span>
      </div>

      <div>
        <p className="text-base font-bold text-fg leading-snug">{title}</p>
        <p className="text-xs text-fg-subtle mt-1">
          {source} · {duration} · {level}
        </p>
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-[3px] h-10">
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`block w-[4px] rounded-full transition-opacity ${playing ? "opacity-100" : "opacity-60"}`}
            style={{
              height: `${h}px`,
              background: `hsl(${185 + i * 2}, 80%, 60%)`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="w-11 h-11 rounded-full bg-[var(--primary)] hover:opacity-90 flex items-center justify-center transition-colors shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause size={18} className="text-on-primary" fill="currentColor" />
          ) : (
            <Play size={18} className="text-on-primary ml-0.5" fill="currentColor" />
          )}
        </button>
        <div>
          <p className="text-xs text-fg font-medium">With transcript</p>
          <p className="text-xs text-fg-muted">+ vocabulary helper</p>
        </div>
      </div>
    </Card>
  );
}
