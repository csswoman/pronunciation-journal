"use client";

import { CheckCheck } from "@/components/icons";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import AIAvatar from "./AIAvatar";
import SuggestionChips from "./SuggestionChips";
import ToolWidget from "./chat/ToolWidget";
import PracticeSession from "./PracticeSession";
import { isExerciseTool } from "@/lib/ai-practice/tools/registry";
import { parseCorrection } from "@/lib/ai-coach/parse-correction";
import CorrectionCard from "./CorrectionCard";
import { extractSentenceContext, extractSuggestions, formatMessageTime, renderProse } from './chat/message-formatting';

// ── AI bubble ─────────────────────────────────────────────────────────────────

interface AIBubbleProps {
  message: Extract<AIMessage, { role: "model" }>;
  showAvatar: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
}

function AIBubble({ message, showAvatar, onSaveWord, onSuggestionClick, onToolAnswer, onNext }: AIBubbleProps) {
  const fullText = message.contentParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map(p => p.text)
    .join("\n");

  const { correction, body: proseBody } = parseCorrection(fullText);

  const hasSuggestions = message.contentParts.some(
    p => p.type === "text" && /^suggestions?:/im.test(proseBody)
  );

  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
      onSaveWord(selected, extractSentenceContext(fullText, selected));
    }
  };

  return (
    <div className="flex items-start justify-start gap-2.5 max-w-[88%] group/msg">
      <div className="flex-shrink-0 w-7 h-7">
        {showAvatar ? <AIAvatar /> : <span className="block w-7 h-7" aria-hidden />}
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {correction && <CorrectionCard correction={correction} />}

        <div
          className="cursor-text select-text rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3.5 py-2.5 text-[var(--text-primary)]"
          onMouseUp={handleMouseUp}
        >
          <div className="space-y-3">
            {(() => {
              const exerciseCalls = message.contentParts
                .filter(p => p.type === "tool_call")
                .map(p => message.toolCalls.get(p.callId))
                .filter((tc): tc is NonNullable<typeof tc> =>
                  tc != null && isExerciseTool(tc.name as never) && tc.status !== "error"
                );

              const textParts = message.contentParts.filter((p): p is { type: "text"; text: string } => p.type === "text");
              const displayText = textParts.length === 1 && correction
                ? proseBody
                : null;

              return (
                <>
                  {message.contentParts.map((part, i) => {
                    if (part.type === "text") {
                      const text = displayText ?? part.text;
                      if (!text.trim()) return null;
                      return <div key={i} className="space-y-2.5">{renderProse(text.split("\n"))}</div>;
                    }
                    const tc = message.toolCalls.get(part.callId);
                    if (!tc || tc.name === "suggestions") return null;
                    if (isExerciseTool(tc.name as never)) return null;
                    return <ToolWidget key={i} toolCall={tc} onAnswer={onToolAnswer} onNext={onNext} />;
                  })}
                  {exerciseCalls.length > 0 && (
                    <PracticeSession
                      key={exerciseCalls[0].id}
                      initialExercises={exerciseCalls}
                      onAnswer={onToolAnswer}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <p className="text-tiny pl-1 opacity-0 text-[var(--text-tertiary)] transition-opacity group-hover/msg:opacity-100">
           {formatMessageTime((message as { createdAt?: Date }).createdAt)}
        </p>

        {hasSuggestions && (
          <SuggestionChips
            suggestions={extractSuggestions(proseBody).map(s => ({ label: s, prompt: s }))}
            onSelect={onSuggestionClick}
          />
        )}
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AIMessage;
  showAvatar?: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
}

export default function MessageBubble({
  message,
  showAvatar = true,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
  onNext,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end group/msg max-w-[88%] ml-auto">
        <div className="flex flex-col items-end gap-1.5">
          <div className="rounded-lg rounded-tr-sm border border-[color-mix(in_srgb,var(--primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-raised))] px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
            {message.content}
          </div>
          <div className="flex items-center gap-1 pr-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <span className="text-tiny text-[var(--text-tertiary)]">
               {formatMessageTime((message as { createdAt?: Date }).createdAt)}
            </span>
            <CheckCheck size={11} className="text-[var(--primary)]" />
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
      onSuggestionClick={onSuggestionClick}
      onToolAnswer={onToolAnswer}
      onNext={onNext}
    />
  );
}
