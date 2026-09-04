"use client";

import type { TabId } from "@/components/ai-coach/ChatTabs";
import { listScriptedMissions } from "@/lib/ai-practice/missions/registry";
import ChatEmptyState from "./ChatEmptyState";
import MissionLibrary from "./missions/MissionLibrary";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string, options?: { hidden?: boolean }) => void;
  onSelectMission: (missionId: string) => void;
  isStreaming: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AICoachHome({
  activeTab,
  onSendMessage,
  onSelectMission,
}: AICoachHomeProps) {
  if (activeTab === "missions") {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <MissionLibrary missions={listScriptedMissions()} onSelect={onSelectMission} />
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
