"use client";

import { Pause, Play, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { InterviewAvatar } from "./InterviewAvatar";

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
    <div className="flex items-start gap-2.5 max-w-[88%] animate-message-in">
      <InterviewAvatar pulsing={isPlaying} />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div
          className="rounded-[14px] rounded-tl-[6px] border px-3.5 py-2.5"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <p className="text-[15px] leading-[1.65]">{text}</p>
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
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
                    style={{ height: `${4 + i * 3}px`, background: "var(--primary)", animationDelay: `${i * 0.12}s` }} />
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
