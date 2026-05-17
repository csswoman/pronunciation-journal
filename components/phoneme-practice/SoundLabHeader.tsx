"use client";

import { Play } from "lucide-react";

interface Props {
  onResume?: () => void;
}

export function SoundLabHeader({ onResume }: Props) {
  return (
    <header className="flex items-start justify-between gap-space-8">
      {/* Left: badge + headline */}
      <div>
        <div className="mb-space-3 flex items-center gap-space-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-tiny font-medium uppercase tracking-widest text-fg-subtle">
            Sound Lab · Live
          </span>
        </div>

        <h1 className="font-heading text-h1 leading-tight">
          <span className="font-light text-fg">Speak </span>
          <span className="font-black text-fg">better,</span>
          <br />
          <em className="font-normal text-primary" style={{ fontStyle: "italic" }}>one sound</em>
          <span className="font-light text-fg"> at a time.</span>
        </h1>
      </div>

      {/* Right: Resume CTA */}
      <button
        type="button"
        onClick={onResume}
        disabled={!onResume}
        className="relative flex flex-shrink-0 items-center gap-space-2 overflow-hidden rounded-full bg-primary px-space-6 py-space-3 text-body-sm font-medium text-on-primary transition-all duration-200 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "rgba(255,255,255,0.32)" }}
        />
        <Play className="h-4 w-4 fill-current" />
        Resume lesson
      </button>
    </header>
  );
}
