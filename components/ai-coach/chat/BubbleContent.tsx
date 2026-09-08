"use client";

import type { AIMessage, ExerciseResult, ToolCall } from "@/lib/ai-practice/types";
import {
  isExerciseTool,
  isInlineWidgetTool,
  type SessionSummaryArgs,
  type TurnSaveable,
} from "@/lib/ai-practice/tools/registry";
import PracticeSession, { type ExerciseSessionSummary } from "../PracticeSession";
import SessionSummaryCard from "../session/SessionSummaryCard";
import ToolWidget from "./ToolWidget";
import { renderProse, stripSuggestions } from "./message-formatting";

// Planned structure:
// <BubbleContent>
//   <Prose />
//   <ToolWidget />
//   <SessionSummaryCard />
//   <PracticeSession />

export interface BubbleContentProps {
  message: Extract<AIMessage, { role: "model" }>;
  /** Suggestion-stripped prose; rendered alone when the turn has no text parts. */
  effectiveProse: string;
  /** Set when a correction replaces the single text part's body. */
  displayText: string | null;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
  onSaveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
  onExerciseComplete?: (summary: ExerciseSessionSummary) => void;
}

/** Tool calls for this turn, in `contentParts` order, skipping errored ones. */
function toolCallsInOrder(message: Extract<AIMessage, { role: "model" }>): ToolCall[] {
  return message.contentParts
    .filter((p) => p.type === "tool_call")
    .map((p) => message.toolCalls.get(p.type === "tool_call" ? p.callId : ""))
    .filter((tc): tc is ToolCall => Boolean(tc && tc.status !== "error"));
}

export default function BubbleContent({
  message,
  effectiveProse,
  displayText,
  onToolAnswer,
  onNext,
  onSaveAllFromSummary,
  onExerciseComplete,
}: BubbleContentProps) {
  const calls = toolCallsInOrder(message);
  const exerciseCalls = calls.filter(
    (tc) => isExerciseTool(tc.name as never) && tc.name !== "render_session_summary",
  );
  const summaryCall = calls.find((tc) => tc.name === "render_session_summary");
  const textParts = message.contentParts.filter((p) => p.type === "text");

  return (
    <>
      {textParts.length === 0 && effectiveProse && (
        <div className="layout-stack-tight">{renderProse(effectiveProse.split("\n"))}</div>
      )}

      {message.contentParts.map((part, i) => {
        if (part.type === "text") {
          const text = stripSuggestions(displayText ?? part.text);
          if (!text.trim()) return null;
          return <div key={i} className="layout-stack-tight">{renderProse(text.split("\n"))}</div>;
        }
        const tc = message.toolCalls.get(part.callId);
        if (!tc || tc.status === "error" || !isInlineWidgetTool(tc.name)) return null;
        return <ToolWidget key={i} toolCall={tc} onAnswer={onToolAnswer} onNext={onNext} />;
      })}

      {summaryCall && (
        <SessionSummaryCard summary={summaryCall.args as SessionSummaryArgs} onSaveAll={onSaveAllFromSummary} />
      )}

      {exerciseCalls.length > 0 && (
        <PracticeSession
          key={exerciseCalls[0].id}
          initialExercises={exerciseCalls}
          onAnswer={onToolAnswer}
          onComplete={onExerciseComplete}
        />
      )}
    </>
  );
}
