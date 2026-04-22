"use client";

import { useState } from "react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import CustomPromptPanel from "./CustomPromptPanel";

const SCENARIOS = [
  { id: "interview", emoji: "💼", label: "Entrevista" },
  { id: "cafe", emoji: "☕", label: "Cafe" },
  { id: "airport", emoji: "✈️", label: "Airport" },
  { id: "doctor", emoji: "🩺", label: "Doctor" },
  { id: "store", emoji: "🛒", label: "Store" },
] as const;

type ScenarioId = (typeof SCENARIOS)[number]["id"];

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  interview: "Entrevista de trabajo",
  cafe: "Coffee with friends",
  airport: "Airport",
  doctor: "Doctor's appointment",
  store: "Store",
};

interface RoleplayViewProps {
  messages: AIMessage[];
  isStreaming: boolean;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onSubmit: (text: string) => void;
  inputPrefill?: string;
  onPrefillConsumed: () => void;
  onToolAnswer?: (callId: string, result: ExerciseResult) => void;
}

export default function RoleplayView({
  messages,
  isStreaming,
  onSaveWord,
  onSuggestionClick,
  onSubmit,
  inputPrefill,
  onPrefillConsumed,
  onToolAnswer,
}: RoleplayViewProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("interview");
  const [showScenarioPicker, setShowScenarioPicker] = useState(false);

  const visibleMessages = messages.filter(m => m.role !== "tool");

  const activeLabel = SCENARIO_LABELS[activeScenario];
  const activeEmoji = SCENARIOS.find((s) => s.id === activeScenario)?.emoji ?? "🎭";

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Active scenario bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b text-xs flex-shrink-0"
        style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
      >
        <span className="uppercase tracking-widest font-medium">Active scenario:</span>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "var(--accent-subtle, #e0edff)",
            color: "var(--accent, #3b82f6)",
          }}
        >
          {activeEmoji} {activeLabel}
        </span>
        <button
          onClick={() => setShowScenarioPicker((v) => !v)}
          className="ml-1 text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--text-tertiary)" }}
        >
          change +
        </button>
      </div>

      {/* Scenario picker */}
      {showScenarioPicker && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0 flex-wrap"
          style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
        >
          <span className="uppercase tracking-widest font-medium text-xs">Scenario:</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveScenario(s.id);
                setShowScenarioPicker(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
              style={{
                borderColor:
                  activeScenario === s.id ? "var(--accent, #3b82f6)" : "var(--line-divider)",
                color:
                  activeScenario === s.id ? "var(--accent, #3b82f6)" : "var(--text-secondary)",
                backgroundColor: "transparent",
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex flex-col gap-5 py-4">
          {visibleMessages.length === 0 && !isStreaming && (
            <div
              className="flex flex-col items-center justify-center h-40 gap-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span className="text-3xl">{activeEmoji}</span>
              <p className="text-sm">
                Scenario: <strong>{activeLabel}</strong>
              </p>
                <p className="text-xs">Write your first line to start the roleplay.</p>
            </div>
          )}

          {visibleMessages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              onSaveWord={onSaveWord}
              onSuggestionClick={onSuggestionClick}
              onToolAnswer={onToolAnswer ?? (() => {})}
              onNext={() => {}}
            />
          ))}

          {isStreaming && <TypingIndicator />}
        </div>
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 p-3 border-t"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <CustomPromptPanel
          onSubmit={onSubmit}
          isDisabled={isStreaming}
          variant="chat"
          placeholder="Write in English... (Enter to send)"
          prefill={inputPrefill}
          onPrefillConsumed={onPrefillConsumed}
        />
      </div>
    </div>
  );
}
