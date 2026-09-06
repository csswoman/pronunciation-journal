"use client";

import { CheckCheck } from "@/components/icons";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import type { ExerciseSessionSummary } from "./PracticeSession";
import { formatMessageTime } from "./chat/message-formatting";
import AIBubble from "./chat/AIBubble";

// Planned structure:
// <MessageBubble>
//   <UserBubble /> | <AIBubble />
// </MessageBubble>

export interface MessageBubbleProps {
  message: AIMessage;
  showAvatar?: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSaveSaveable: (saveable: TurnSaveable) => Promise<void>;
  onSaveConcept?: (title: string, body: string) => Promise<void>;
  onSaveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
  onSaveTranslation?: (translation: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
  onExerciseComplete?: (summary: ExerciseSessionSummary) => void;
}

export default function MessageBubble({
  message,
  showAvatar = true,
  onSaveWord,
  onSaveSaveable,
  onSaveConcept,
  onSaveAllFromSummary,
  onSaveTranslation,
  onSuggestionClick,
  onToolAnswer,
  onNext,
  onExerciseComplete,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="group/msg ml-auto flex max-w-[min(88%,36rem)] justify-end">
        <div className="flex flex-col items-end gap-1.5">
          <div className="rounded-md rounded-br-sm border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] bg-[color-mix(in_oklch,var(--primary)_12%,var(--surface-raised))] px-3.5 py-2.5 text-body-sm leading-relaxed break-words whitespace-pre-wrap text-fg">
            {message.content}
          </div>
          <div className="flex items-center gap-1 pr-1 opacity-0 transition-opacity group-hover/msg:opacity-100 motion-reduce:transition-none">
            <span className="text-tiny text-fg-subtle">
              {formatMessageTime((message as { createdAt?: Date }).createdAt)}
            </span>
            <CheckCheck size={12} strokeWidth={2} className="text-primary" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "tool") return null;

  return (
    <AIBubble
      message={message}
      showAvatar={showAvatar}
      onSaveWord={onSaveWord}
      onSaveSaveable={onSaveSaveable}
      onSaveConcept={onSaveConcept}
      onSaveAllFromSummary={onSaveAllFromSummary}
      onSaveTranslation={onSaveTranslation}
      onSuggestionClick={onSuggestionClick}
      onToolAnswer={onToolAnswer}
      onNext={onNext}
      onExerciseComplete={onExerciseComplete}
    />
  );
}
