"use client";

import { Pause, Play, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

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
      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--line-divider)] text-sm">
        🎙️
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        <span className="ml-1 text-xs font-medium text-[var(--muted-text)]">Interviewer</span>
        <div className="rounded-2xl rounded-tl-sm border border-[var(--line-divider)] bg-[var(--card-bg)] px-4 py-3">
          <p className="text-sm leading-relaxed text-[var(--body-text)]">{text}</p>
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--line-divider)] pt-3">
            <Button
              variant={isPlaying ? "primary" : "ghost"}
              size="sm"
              icon={isPlaying ? <Pause size={12} /> : <Play size={12} />}
              onClick={onListen}
            >
              {isPlaying ? "Pause" : "Listen"}
            </Button>
            {isPlaying && (
              <span className="flex gap-0.5 items-end h-3.5">
                {[1, 2, 3].map((i) => (
                  <span key={i} className="w-0.5 rounded-full animate-bounce"
                    style={{ height: `${4 + i * 3}px`, background: "var(--color-accent)", animationDelay: `${i * 0.12}s` }} />
                ))}
              </span>
            )}
            {isActive && hasNextCandidate && (
              <Button variant="primary" size="sm" icon={<ChevronRight size={12} />} iconPosition="right" onClick={onRevealNext} className="ml-auto">
                Answer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
