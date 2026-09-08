"use client";

import { Languages, Square, Volume2 } from "@/components/icons";
import { formatMessageTime } from "./message-formatting";

// Planned structure:
// <BubbleActions>
//   <Timestamp />
//   <SpeakButton />
//   <TranslateButton />

export interface BubbleActionsProps {
  timestamp: string;
  /** Hides both buttons when the turn carries no speakable/translatable prose. */
  hasProse: boolean;
  speechAvailable: boolean;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  isTranslating: boolean;
  translationVisible: boolean;
  onToggleTranslation: () => void;
}

const ACTION_CLASS =
  "inline-flex items-center gap-1 text-tiny font-medium text-fg-subtle hover:text-primary transition-colors cursor-pointer";

export default function BubbleActions({
  timestamp,
  hasProse,
  speechAvailable,
  isSpeaking,
  onToggleSpeech,
  isTranslating,
  translationVisible,
  onToggleTranslation,
}: BubbleActionsProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-tiny text-fg-subtle opacity-0 transition-opacity group-hover/msg:opacity-100 motion-reduce:transition-none">
        {formatMessageTime(timestamp)}
      </p>
      <div className="flex items-center gap-3">
        {speechAvailable && hasProse && (
          <button type="button" onClick={onToggleSpeech} className={ACTION_CLASS}>
            {isSpeaking ? <Square size={12} strokeWidth={1.8} /> : <Volume2 size={12} strokeWidth={1.8} />}
            <span>{isSpeaking ? "Detener" : "Escuchar"}</span>
          </button>
        )}
        {hasProse && (
          <button type="button" onClick={onToggleTranslation} disabled={isTranslating} className={ACTION_CLASS}>
            <Languages size={12} strokeWidth={1.8} />
            <span>{isTranslating ? "Traduciendo..." : translationVisible ? "Ver original" : "Traducir"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
