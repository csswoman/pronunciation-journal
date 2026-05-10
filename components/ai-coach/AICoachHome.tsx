"use client";

import { useState } from "react";
import type { TabId } from "@/components/ai-coach/ChatTabs";
import CustomPromptPanel from "@/components/ai-coach/CustomPromptPanel";
import ChatEmptyState from "./ChatEmptyState";
import InterviewView from "./InterviewView";

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
  const [chipPrefill, setChipPrefill] = useState<string | undefined>(undefined);

  if (activeTab === "interview") {
    return <InterviewView />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        <ChatEmptyState
          onSendMessage={onSendMessage}
          onChipSelect={setChipPrefill}
        />
      </div>
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
    </div>
  );
}
