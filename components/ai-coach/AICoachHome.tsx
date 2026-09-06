"use client";

import type { TabId } from "@/components/ai-coach/ChatTabs";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";
import { listScriptedMissions } from "@/lib/ai-practice/missions/registry";
import ChatEmptyState from "./ChatEmptyState";
import MissionLibrary from "./missions/MissionLibrary";

// Planned structure:
// <AICoachHome>
//   <MissionLibrary />
//   <ChatEmptyState />
// </AICoachHome>

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string, options?: { hidden?: boolean; starterId?: StarterId }) => void;
  onSelectMission: (missionId: string) => void;
  isStreaming: boolean;
  starters?: ResolvedStarter[] | null;
  startersLoading?: boolean;
  onStarterUsed?: (id: StarterId, angle: string) => void;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AICoachHome({
  activeTab,
  onSendMessage,
  onSelectMission,
  starters = null,
  startersLoading = false,
  onStarterUsed,
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
        <ChatEmptyState
          starters={starters}
          loading={startersLoading}
          onSelectStarter={(starter) => {
            onStarterUsed?.(starter.id, starter.angle);
            onSendMessage(starter.prompt, { hidden: true, starterId: starter.id });
          }}
          onSendMessage={(text) => onSendMessage(text, { hidden: true })}
        />
      </div>
    </div>
  );
}
