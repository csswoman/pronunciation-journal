"use client";

import { Mic, Loader2, Check } from "lucide-react";
import type { MicState } from "./exercise-types";

const STATE_LABEL: Record<MicState, string> = {
  idle:       "Tap to record",
  recording:  "Listening…",
  processing: "Analyzing…",
  done:       "Got it",
};

interface Props {
  state: MicState;
  onStart: () => void;
  onStop: () => void;
}

export default function MicButton({ state, onStart, onStop }: Props) {
  function handleClick() {
    if (state === "idle") onStart();
    else if (state === "recording") onStop();
  }

  return (
    <div className="flex flex-col items-center gap-space-2">
      {/* Outer ring — RECORDING pulse */}
      <div className="relative flex items-center justify-center w-[104px] h-[104px]">
        {state === "recording" && (
          <span
            className="absolute inset-0 rounded-full bg-error animate-mic-ring"
            aria-hidden
          />
        )}

        <button
          onClick={handleClick}
          disabled={state === "processing" || state === "done"}
          aria-label={STATE_LABEL[state]}
          className={[
            "relative z-10 flex items-center justify-center w-[104px] h-[104px] rounded-full",
            "border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2",
            state === "idle"       && "bg-primary-soft border-primary text-primary animate-mic-breathe focus-visible:ring-primary",
            state === "recording"  && "bg-error border-error text-on-primary focus-visible:ring-error",
            state === "processing" && "bg-surface-raised border-border-strong text-fg-muted cursor-wait",
            state === "done"       && "bg-success-soft border-success-border text-success",
          ].filter(Boolean).join(" ")}
        >
          {state === "idle" && <Mic className="w-10 h-10" />}
          {state === "recording" && <Mic className="w-10 h-10" />}
          {state === "processing" && <Loader2 className="w-10 h-10 animate-spin" />}
          {state === "done" && <Check className="w-10 h-10" />}
        </button>
      </div>

      <span className="text-caption text-fg-muted">{STATE_LABEL[state]}</span>
    </div>
  );
}
