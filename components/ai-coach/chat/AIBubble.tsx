"use client";

import { useEffect, useRef } from "react";
import { useCoachSpeech } from "@/hooks/useCoachSpeech";
import { useMessageTranslation } from "@/hooks/useMessageTranslation";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import { cn } from "@/lib/cn";
import AIAvatar from "../AIAvatar";
import SuggestionChips from "../SuggestionChips";
import type { ExerciseSessionSummary } from "../PracticeSession";
import { isInlineWidgetTool, type TurnSaveable } from "@/lib/ai-practice/tools/registry";
import { parseCorrection } from "@/lib/ai-coach/parse-correction";
import { extractTurnCorrection, extractTurnSaveables, extractTurnConcept } from "@/lib/ai-practice/correction";
import CorrectionCard from "../CorrectionCard";
import SaveChips from "../SaveChips";
import SaveConceptChip from "../SaveConceptChip";
import BubbleActions from "./BubbleActions";
import BubbleContent from "./BubbleContent";
import BubbleTranslation from "./BubbleTranslation";
import {
  extractSentenceContext,
  extractSuggestions,
  generateContextualSuggestions,
  stripSuggestions,
} from "./message-formatting";

// Planned structure:
// <AIBubble>
//   <AIAvatar />
//   <CorrectionCard />
//   <BubbleContent />
//   <BubbleTranslation />
//   <BubbleActions />
//   <SuggestionChips />
//   <SaveChips />
//   <SaveConceptChip />
// </AIBubble>

export interface AIBubbleProps {
  message: Extract<AIMessage, { role: "model" }>;
  showAvatar: boolean;
  autoSpeak?: boolean;
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

export default function AIBubble({
  message, showAvatar, autoSpeak, onSaveWord, onSaveSaveable, onSaveConcept, onSaveAllFromSummary,
  onSaveTranslation, onSuggestionClick, onToolAnswer, onNext, onExerciseComplete,
}: AIBubbleProps) {
  const fullText = message.contentParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const toolCorrection = extractTurnCorrection(message.toolCalls);
  const saveables = extractTurnSaveables(message.toolCalls);
  const concept = extractTurnConcept(message.toolCalls);
  const parsed = parseCorrection(fullText);
  const correction = toolCorrection ?? parsed.correction;
  const rawProse = toolCorrection ? fullText : parsed.body;
  const proseBody = rawProse.trim();
  const extractedSuggestions = extractSuggestions(proseBody);
  const effectiveProse = stripSuggestions(proseBody);
  const hasProse = Boolean(effectiveProse.trim());

  const messageKey = message.timestamp || fullText;
  const { isSpeaking, isAvailable, toggle: toggleSpeech, speak } = useCoachSpeech({
    text: effectiveProse,
    ownerId: messageKey,
  });

  const translation = useMessageTranslation({
    text: effectiveProse || fullText,
    onTranslated: onSaveTranslation,
    initial: message.translation,
  });

  const autoplayedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSpeak || !hasProse || !isAvailable) return;
    if (autoplayedRef.current === messageKey) return;
    autoplayedRef.current = messageKey;
    speak();
  }, [autoSpeak, messageKey, hasProse, isAvailable, speak]);

  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
      onSaveWord(selected, extractSentenceContext(fullText || effectiveProse, selected));
    }
  };

  const chips = extractedSuggestions.length > 0
    ? extractedSuggestions.map((s) => ({ label: s, prompt: s }))
    : generateContextualSuggestions(effectiveProse || fullText);

  const textParts = message.contentParts.filter((p): p is { type: "text"; text: string } => p.type === "text");
  const displayText = textParts.length === 1 && correction ? effectiveProse : null;

  const hasContentBox = hasProse || translation.isVisible || message.contentParts.some((p) => {
    if (p.type !== "tool_call") return false;
    const tc = message.toolCalls.get(p.callId);
    return tc && tc.status !== "error" && (isInlineWidgetTool(tc.name) || tc.name === "render_session_summary");
  });

  return (
    <div className="group/msg flex max-w-[min(88%,36rem)] items-start justify-start gap-3">
      <div className="flex size-8 shrink-0 items-start pt-0.5">
        {showAvatar ? <AIAvatar /> : <span className="block size-8" aria-hidden />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {correction && <CorrectionCard correction={correction} />}

        {hasContentBox && (
          <div
            className={cn(
              "cursor-text select-text rounded-md border border-border-subtle bg-surface-raised px-3.5 py-2.5 text-fg",
              showAvatar && "rounded-bl-sm",
            )}
            onMouseUp={handleMouseUp}
          >
            <div className="layout-stack">
              <BubbleContent
                message={message}
                effectiveProse={effectiveProse}
                displayText={displayText}
                onToolAnswer={onToolAnswer}
                onNext={onNext}
                onSaveAllFromSummary={onSaveAllFromSummary}
                onExerciseComplete={onExerciseComplete}
              />
              {translation.isVisible && (
                <BubbleTranslation
                  translation={translation.translation}
                  isLoading={translation.isLoading}
                  hasError={translation.hasError}
                  onRetry={() => void translation.toggle(true)}
                />
              )}
            </div>
          </div>
        )}

        <BubbleActions
          timestamp={message.timestamp}
          hasProse={hasProse}
          speechAvailable={isAvailable}
          isSpeaking={isSpeaking}
          onToggleSpeech={toggleSpeech}
          isTranslating={translation.isLoading}
          translationVisible={translation.isVisible}
          onToggleTranslation={() => void translation.toggle()}
        />

        {chips.length > 0 && hasProse && <SuggestionChips suggestions={chips} onSelect={onSuggestionClick} />}
        {saveables.length > 0 && <SaveChips saveables={saveables} onSave={onSaveSaveable} />}
        {concept && onSaveConcept && (
          <SaveConceptChip onSave={() => onSaveConcept(concept.title, stripSuggestions(proseBody || fullText))} />
        )}
      </div>
    </div>
  );
}
