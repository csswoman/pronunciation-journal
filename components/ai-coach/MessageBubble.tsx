"use client";

import { useState } from "react";
import { CheckCheck, Languages } from "@/components/icons";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import { cn } from "@/lib/cn";
import AIAvatar from "./AIAvatar";
import SuggestionChips from "./SuggestionChips";
import ToolWidget from "./chat/ToolWidget";
import PracticeSession, { type ExerciseSessionSummary } from "./PracticeSession";
import { isExerciseTool } from "@/lib/ai-practice/tools/registry";
import { parseCorrection } from "@/lib/ai-coach/parse-correction";
import CorrectionCard from "./CorrectionCard";
import {
  extractSentenceContext,
  extractSuggestions,
  formatMessageTime,
  renderProse,
} from "./chat/message-formatting";

function generateContextualSuggestions(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("smile") || lower.includes("happy") || lower.includes("made your day") || lower.includes("made you feel")) {
    return [
      { label: "I had a great coffee this morning", prompt: "I had a great cup of coffee this morning." },
      { label: "I talked with a good friend", prompt: "I had a nice conversation with a good friend today." },
      { label: "How do I say it in English?", prompt: "I want to share something, but how do I say it in English?" },
    ];
  }

  if (lower.includes("how are you") || lower.includes("how's your day") || lower.includes("how was your day")) {
    return [
      { label: "I'm doing well, thank you!", prompt: "I'm doing really well today, thank you! How are you?" },
      { label: "It's been a busy day", prompt: "It's been a pretty busy day for me so far." },
      { label: "Just relaxing right now", prompt: "Just relaxing right now and practicing my English." },
    ];
  }

  if (lower.includes("plan") || lower.includes("weekend") || lower.includes("free time") || lower.includes("hobby")) {
    return [
      { label: "I plan to relax at home", prompt: "I'm planning to relax at home and watch a movie." },
      { label: "Going out with friends", prompt: "I'm planning to go out with some friends." },
      { label: "Working on a project", prompt: "I'll be working on some personal projects." },
    ];
  }

  return [
    { label: "Could you give me an example?", prompt: "Could you give me an example to help me understand?" },
    { label: "Can you rephrase that simpler?", prompt: "Could you rephrase that in simpler English please?" },
    { label: "How do I answer this in English?", prompt: "How would a native speaker typically answer this question?" },
  ];
}

interface AIBubbleProps {
  message: Extract<AIMessage, { role: "model" }>;
  showAvatar: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSaveTranslation?: (translation: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
  onExerciseComplete?: (summary: ExerciseSessionSummary) => void;
}

function AIBubble({
  message,
  showAvatar,
  onSaveWord,
  onSaveTranslation,
  onSuggestionClick,
  onToolAnswer,
  onNext,
  onExerciseComplete,
}: AIBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(Boolean(message.translation));
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(message.translation ?? null);
  const [translationError, setTranslationError] = useState(false);

  const fullText = message.contentParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const { correction, body: proseBody } = parseCorrection(fullText);

  const hasSuggestions = message.contentParts.some(
    (p) => p.type === "text" && /^suggestions?:/im.test(proseBody),
  );

  const handleToggleTranslation = async (forceRetry = false) => {
    if (showTranslation && !translationError && !forceRetry) {
      setShowTranslation(false);
      return;
    }
    if (translatedText && !translationError && !forceRetry) {
      setShowTranslation(true);
      return;
    }
    setTranslationError(false);
    setTranslatedText(null);
    setIsTranslating(true);
    setShowTranslation(true);
    try {
      const textToTranslate = proseBody || fullText;
      const res = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.translation || "").trim();
        if (text) {
          setTranslatedText(text);
          setTranslationError(false);
          onSaveTranslation?.(text);
        } else {
          setTranslatedText("No se pudo traducir este mensaje.");
          setTranslationError(true);
        }
      } else {
        setTranslatedText("No se pudo obtener la traducción en este momento.");
        setTranslationError(true);
      }
    } catch {
      setTranslatedText("Error de conexión al traducir.");
      setTranslationError(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
      onSaveWord(selected, extractSentenceContext(fullText, selected));
    }
  };

  const chips = hasSuggestions
    ? extractSuggestions(proseBody).map((s) => ({ label: s, prompt: s }))
    : generateContextualSuggestions(proseBody || fullText);

  return (
    <div className="group/msg flex max-w-[min(88%,36rem)] items-start justify-start gap-3">
      <div className="flex size-8 shrink-0 items-start pt-0.5">
        {showAvatar ? <AIAvatar /> : <span className="block size-8" aria-hidden />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {correction && <CorrectionCard correction={correction} />}

        <div
          className={cn(
            "cursor-text select-text rounded-md border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-fg",
            showAvatar && "rounded-bl-sm",
          )}
          onMouseUp={handleMouseUp}
        >
          <div className="layout-stack">
            {(() => {
              const exerciseCalls = message.contentParts
                .filter((p) => p.type === "tool_call")
                .map((p) => message.toolCalls.get(p.callId))
                .filter(
                  (tc): tc is NonNullable<typeof tc> =>
                    tc != null && isExerciseTool(tc.name as never) && tc.status !== "error",
                );

              const textParts = message.contentParts.filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              );
              const displayText =
                textParts.length === 1 && correction ? proseBody : null;

              return (
                <>
                  {message.contentParts.map((part, i) => {
                    if (part.type === "text") {
                      const text = displayText ?? part.text;
                      if (!text.trim()) return null;
                      return (
                        <div key={i} className="layout-stack-tight">
                          {renderProse(text.split("\n"))}
                        </div>
                      );
                    }
                    const tc = message.toolCalls.get(part.callId);
                    if (!tc || tc.name === "suggestions") return null;
                    if (isExerciseTool(tc.name as never)) return null;
                    return (
                      <ToolWidget
                        key={i}
                        toolCall={tc}
                        onAnswer={onToolAnswer}
                        onNext={onNext}
                      />
                    );
                  })}
                  {exerciseCalls.length > 0 && (
                    <PracticeSession
                      key={exerciseCalls[0].id}
                      initialExercises={exerciseCalls}
                      onAnswer={onToolAnswer}
                      onComplete={onExerciseComplete}
                    />
                  )}
                  {showTranslation && (
                    <div className="mt-2.5 pt-2 border-t border-border-subtle/80 text-caption text-fg-muted bg-surface-sunken/60 px-3 py-2 rounded-md">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xxs uppercase tracking-wider text-primary">Traducción</span>
                        {translationError && (
                          <button
                            type="button"
                            onClick={() => handleToggleTranslation(true)}
                            disabled={isTranslating}
                            className="text-xxs font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {isTranslating ? "Cargando..." : "Reintentar"}
                          </button>
                        )}
                      </div>
                      <p className={cn("m-0 text-pretty text-body-sm leading-relaxed", translationError && "text-error font-medium")}>
                        {isTranslating ? "Cargando traducción..." : (translatedText || "Cargando traducción...")}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-tiny text-fg-subtle opacity-0 transition-opacity group-hover/msg:opacity-100 motion-reduce:transition-none">
            {formatMessageTime((message as { createdAt?: Date }).createdAt)}
          </p>
          <button
            type="button"
            onClick={() => handleToggleTranslation(false)}
            disabled={isTranslating}
            className="inline-flex items-center gap-1 text-tiny font-medium text-fg-subtle hover:text-primary transition-colors cursor-pointer"
          >
            <Languages size={12} strokeWidth={1.8} />
            <span>{isTranslating ? "Traduciendo..." : showTranslation ? "Ver original" : "Traducir"}</span>
          </button>
        </div>

        {chips.length > 0 && (
          <SuggestionChips
            suggestions={chips}
            onSelect={onSuggestionClick}
          />
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: AIMessage;
  showAvatar?: boolean;
  onSaveWord: (word: string, context: string) => void;
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
      onSaveTranslation={onSaveTranslation}
      onSuggestionClick={onSuggestionClick}
      onToolAnswer={onToolAnswer}
      onNext={onNext}
      onExerciseComplete={onExerciseComplete}
    />
  );
}
