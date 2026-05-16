"use client";

import { Play } from "lucide-react";

interface Props {
  onResume?: () => void;
}

export function SoundLabHeader({ onResume }: Props) {
  return (
    <header className="mb-space-8 flex items-start justify-between gap-space-8">
      <div>
        <p className="mb-space-2 text-tiny uppercase tracking-widest text-fg-subtle">
          Sound Lab
        </p>
        <h1 className="font-heading text-h1 text-fg">
          Speak better,{" "}
          <span className="text-primary">one sound</span>{" "}
          at a time
        </h1>
      </div>

      <button
        type="button"
        onClick={onResume}
        disabled={!onResume}
        className="relative mt-space-4 flex flex-shrink-0 items-center gap-space-2 overflow-hidden rounded-full bg-primary px-space-6 py-space-3 text-body-sm font-medium text-on-primary transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* inner top highlight for energy feel */}
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
