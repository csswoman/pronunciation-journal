"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { useAIPractice } from "@/hooks/useAIPractice";
import { useAuth } from "@/components/auth/AuthProvider";
import PronunciationView from "@/components/ai-coach/PronunciationView";
import ChatTabs, { type TabId } from "@/components/ai-coach/ChatTabs";
import { useCoachStarters } from "@/hooks/useCoachStarters";
import SaveWordModal from "@/components/ai-coach/SaveWordModal";
import { getRecentConversations } from "@/lib/db/ai";
import type { AIConversation } from "@/lib/types";
import { getPageContext } from "./page-context";
import { usePanelResize } from "./usePanelResize";
import { AICoachHeader, AICoachMobileScrim, AICoachResizeHandle, ConversationHistoryPanel } from "./AICoachPanelParts";
import type { MissionLaunch } from "@/lib/ai-practice/missions/launch";
import { getMission } from "@/lib/ai-practice/missions/registry";
import { isScriptedMission } from "@/lib/ai-practice/missions/types";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import CoachSessionEndButton from "./session/CoachSessionEndButton";
import { buildSessionSummaryPrompt } from "@/lib/ai-prompts";
import { renderMission, renderHome, renderActiveChat } from "./AICoachPanelViews";

// Planned structure:
// <AICoachPanel>
//   <AICoachMobileScrim />
//   <AICoachResizeHandle />
//   <AICoachHeader />
//   <ChatTabs />
//   <ConversationHistoryPanel /> | <TabsContainer>
//     <ChatTab />
//     <MissionsTab />
//     <PronunciationTab />
//   <SaveWordModal />
// </AICoachPanel>

export const PANEL_WIDTH = 380;

function tabForMission(missionId: string): TabId {
  const mission = getMission(missionId);
  return mission && isScriptedMission(mission) ? "missions" : "chat";
}

export default function AICoachPanel() {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isOpen, isFullscreen, panelWidth, close, setPanelWidth, launch, consumeLaunch } = useAICoachStore();
  const pathname = usePathname();
  const ctx = getPageContext(pathname);
  const { onDragStart } = usePanelResize({ panelWidth, setPanelWidth });

  const {
    messages, userTurnCount, isStreaming, error, quotaExhausted, wordToSave, conversationId,
    activeMissionId, sendMessage, retryLastFailedSend, dismissError, answerToolCall, saveTranslation,
    openSaveWordModal, closeSaveWordModal, confirmSaveWord, saveSaveable, saveConcept, resetSession, finalizeSession,
    loadConversation, removeConversation, changeMode, setMissionIntentHandler,
  } = useAIPractice();

  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const [missionLaunch, setMissionLaunch] = useState<MissionLaunch | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (!isOpen) { wasOpen.current = false; return; }
    const justOpened = !wasOpen.current;
    wasOpen.current = true;
    if (justOpened) setShowHistory(false);

    if (launch) {
      if (launch.tab) setActiveTab(launch.tab);
      if (launch.prefill) setInputPrefill(launch.prefill);
      if (launch.mission) {
        setMissionLaunch(launch.mission);
        setActiveTab(tabForMission(launch.mission.missionId));
        void changeMode(`mission:${launch.mission.missionId}`);
      }
      consumeLaunch();
    } else if (justOpened) {
      setActiveTab("chat");
    }
  }, [isOpen, launch, consumeLaunch, changeMode]);

  useEffect(() => {
    if (activeMissionId) setActiveTab(tabForMission(activeMissionId));
  }, [activeMissionId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!user?.id) { setConversations([]); return; }
    void getRecentConversations(user.id, 30).then(setConversations);
  }, [isOpen, conversationId, user?.id]);

  // Cierre modal con tecla Escape (Apple HIG: Modality / Keyboards)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showHistory) setShowHistory(false);
        else { finalizeSession(); close(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, showHistory, finalizeSession, close]);

  const hasMessages = messages.some((m) => m.role !== "tool" && !(m.role === "user" && m.hidden)) || isStreaming;

  const panelStyle = {
    transform: isMobile ? (isOpen ? "translateY(0)" : "translateY(100%)") : (isOpen ? "translateX(0)" : "translateX(100%)"),
    transition: isMobile ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "transform 0.25s ease",
    ...(isMobile ? {} : { width: isFullscreen ? "calc(100vw - var(--sidebar-width))" : `${panelWidth}px` }),
  } as const;

  // Saved concurrently and with `allSettled` so one rejected item no longer
  // aborts the rest of the batch halfway through.
  const saveAllFromSummary = useCallback(
    async (learned: TurnSaveable[]) => {
      await Promise.allSettled(learned.map((item) => saveSaveable(item)));
    },
    [saveSaveable],
  );

  const { starters, loading: startersLoading, noteUse, refresh: refreshStarters } = useCoachStarters(isOpen);

  return (
    <>
      {isMobile && isOpen && <AICoachMobileScrim onClose={() => { finalizeSession(); close(); }} />}

      <aside
        role="dialog"
        aria-modal={isMobile && isOpen ? "true" : undefined}
        aria-label="Panel de práctica AI Coach"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className="fixed z-50 flex flex-col bg-surface-raised shadow-xl max-md:inset-0 max-md:border-0 md:top-0 md:right-0 md:bottom-0 md:border-l md:border-border-subtle motion-reduce:transition-none"
        style={panelStyle}
      >
        {!isFullscreen && !isMobile && <AICoachResizeHandle onDragStart={onDragStart} />}

        <AICoachHeader
          pageLabel={ctx.label} showHistory={showHistory}
          onNewChat={() => { resetSession(); setActiveTab("chat"); refreshStarters(); }}
          onToggleHistory={() => setShowHistory((v) => !v)}
          onClose={() => { finalizeSession(); close(); }}
          endSessionSlot={
            <CoachSessionEndButton
              userTurns={userTurnCount}
              isStreaming={isStreaming}
              onEnd={() => sendMessage(buildSessionSummaryPrompt(), { hidden: true })}
            />
          }
        />

        <div className="shrink-0"><ChatTabs active={activeTab} onChange={setActiveTab} /></div>

        {showHistory && (
          <ConversationHistoryPanel
            conversations={conversations} activeId={conversationId}
            onSelect={(conv) => { loadConversation(conv); setShowHistory(false); setActiveTab("chat"); }}
            onDelete={async (id) => { await removeConversation(id); setConversations((p) => p.filter((i) => i.id !== id)); }}
            onClose={() => setShowHistory(false)}
          />
        )}

        {!showHistory && (
          <>
            {/* Pestaña Chat */}
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden${activeTab !== "chat" ? " hidden" : ""}`}>
              {activeMissionId && tabForMission(activeMissionId) === "chat" ? (
                renderMission({
                  activeMissionId, missionLaunch, setMissionIntentHandler, messages, isStreaming,
                  quotaExhausted, sendMessage, openSaveWordModal, saveSaveable, saveAllFromSummary,
                  answerToolCall, changeMode, setActiveTab, exitTab: "chat",
                })
              ) : !hasMessages ? (
                renderHome({
                  tab: "chat", sendMessage, changeMode, isStreaming, starters, startersLoading,
                  noteUse, inputPrefill, setInputPrefill,
                  error, quotaExhausted, onRetry: retryLastFailedSend, onDismissError: dismissError,
                })
              ) : (
                renderActiveChat({
                  messages, isStreaming, error, quotaExhausted, resetSession, openSaveWordModal,
                  saveSaveable, saveConcept, saveAllFromSummary, saveTranslation, inputPrefill, setInputPrefill,
                  answerToolCall, sendMessage, retryLastFailedSend,
                })
              )}
            </div>

            {/* Pestaña Misiones */}
            <div className={`flex flex-1 flex-col min-h-0 overflow-hidden${activeTab !== "missions" ? " hidden" : ""}`}>
              {activeMissionId && tabForMission(activeMissionId) === "missions"
                ? renderMission({
                    activeMissionId, missionLaunch, setMissionIntentHandler, messages, isStreaming,
                    quotaExhausted, sendMessage, openSaveWordModal, saveSaveable, saveAllFromSummary,
                    answerToolCall, changeMode, setActiveTab, exitTab: "missions",
                  })
                : renderHome({
                    tab: "missions", sendMessage, changeMode, isStreaming, starters, startersLoading,
                    noteUse, inputPrefill, setInputPrefill,
                    error, quotaExhausted, onRetry: retryLastFailedSend, onDismissError: dismissError,
                  })}
            </div>

            {/* Pestaña Pronunciación */}
            <div className={`flex-1 min-h-0 overflow-hidden${activeTab !== "pronunciation" ? " hidden" : ""}`}>
              <PronunciationView />
            </div>
          </>
        )}
      </aside>

      {wordToSave && (
        <SaveWordModal
          word={wordToSave.word} context={wordToSave.context}
          onConfirm={confirmSaveWord} onClose={closeSaveWordModal}
        />
      )}
    </>
  );
}
