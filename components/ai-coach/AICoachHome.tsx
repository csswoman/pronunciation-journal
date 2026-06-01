"use client";

import type { TabId } from "@/components/ai-coach/ChatTabs";
import ChatEmptyState from "./ChatEmptyState";
import InterviewView from "./InterviewView";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string, options?: { hidden?: boolean }) => void;
  isStreaming: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AICoachHome({
  activeTab,
  onSendMessage,
}: AICoachHomeProps) {
  if (activeTab === "interview") {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <InterviewView />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        <ChatEmptyState onSendMessage={(text) => onSendMessage(text, { hidden: true })} />
      </div>
    </div>
  );
}
