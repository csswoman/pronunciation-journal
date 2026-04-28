"use client";

import { Pause, Play, ChevronRight } from "lucide-react";
import { ghostBtn, primaryBtn } from "./interview-utils";

interface Props {
  text: string;
  isActive: boolean;
  isPlaying: boolean;
  hasNextCandidate: boolean;
  onListen: () => void;
  onRevealNext: () => void;
}

export function InterviewerBubble({ text, isActive, isPlaying, hasNextCandidate, onListen, onRevealNext }: Props) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1"
        style={{ background: "var(--line-divider)" }}>
        🎙️
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <span className="text-xs font-medium ml-1" style={{ color: "var(--muted-text)" }}>Interviewer</span>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--body-text)" }}>{text}</p>
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
            <button
              onClick={onListen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={isPlaying ? { background: "var(--color-accent)", color: "var(--color-text-on-accent)" } : ghostBtn}
            >
              {isPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Listen</>}
            </button>
            {isPlaying && (
              <span className="flex gap-0.5 items-end h-3.5">
                {[1, 2, 3].map((i) => (
                  <span key={i} className="w-0.5 rounded-full animate-bounce"
                    style={{ height: `${4 + i * 3}px`, background: "var(--color-accent)", animationDelay: `${i * 0.12}s` }} />
                ))}
              </span>
            )}
            {isActive && hasNextCandidate && (
              <button
                onClick={onRevealNext}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={primaryBtn}
              >
                Answer <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
