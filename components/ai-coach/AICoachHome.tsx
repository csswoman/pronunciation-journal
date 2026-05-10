"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TabId } from "@/components/ai-coach/ChatTabs";
import CustomPromptPanel from "@/components/ai-coach/CustomPromptPanel";
import ChatEmptyState from "./ChatEmptyState";
import InterviewConfig, { type Scenario, type Level, type Difficulty } from "./InterviewConfig";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AICoachHome({
  activeTab,
  onSendMessage,
  isStreaming,
  prefill,
  onPrefillConsumed,
}: AICoachHomeProps) {
  const router = useRouter();

  const [chipPrefill, setChipPrefill] = useState<string | undefined>(undefined);

  const [scenario, setScenario] = useState<Scenario>("hr");
  const [level, setLevel] = useState<Level>("intermediate");
  const [difficulty, setDifficulty] = useState<Difficulty>("guided");

  const isInterview = activeTab === "interview";

  function startInterview() {
    sessionStorage.setItem("interviewConfig", JSON.stringify({ scenario, level, difficulty }));
    router.push("/interview");
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        {isInterview ? (
          <InterviewConfig
            scenario={scenario}
            level={level}
            difficulty={difficulty}
            onScenarioChange={setScenario}
            onLevelChange={setLevel}
            onDifficultyChange={setDifficulty}
          />
        ) : (
          <ChatEmptyState
            onSendMessage={onSendMessage}
            onChipSelect={setChipPrefill}
          />
        )}
      </div>

      {/* Fixed bottom */}
      {isInterview ? (
        <div className="px-4 pt-2 pb-4 shrink-0">
          <button
            onClick={startInterview}
            className="w-full py-3 rounded-2xl bg-[var(--primary)] border-none text-sm font-semibold text-[var(--on-primary)] cursor-pointer transition-[opacity,transform] duration-150 hover:opacity-90 hover:-translate-y-px"
          >
            Start Interview →
          </button>
        </div>
      ) : (
        <div className="shrink-0 px-4 pt-3 pb-5">
          <CustomPromptPanel
            onSubmit={onSendMessage}
            isDisabled={isStreaming}
            variant="chat"
            placeholder="Ask your English Coach..."
            prefill={chipPrefill ?? prefill}
            onPrefillConsumed={() => { setChipPrefill(undefined); onPrefillConsumed?.(); }}
          />
        </div>
      )}
    </div>
  );
}
