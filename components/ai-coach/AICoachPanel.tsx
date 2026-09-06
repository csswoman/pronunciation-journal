"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "@/components/icons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { useAIPractice } from "@/hooks/useAIPractice";
import { useAuth } from "@/components/auth/AuthProvider";
import ChatView from "@/components/ai-coach/ChatView";
import PronunciationView from "@/components/ai-coach/PronunciationView";
import CustomPromptPanel from "@/components/ai-coach/CustomPromptPanel";
import ChatTabs, { type TabId } from "@/components/ai-coach/ChatTabs";
import AICoachHome from "@/components/ai-coach/AICoachHome";
import SaveWordModal from "@/components/ai-coach/SaveWordModal";
import ErrorBanner from "@/components/ai-coach/ErrorBanner";
import QuotaExhaustedCard from "@/components/ai-coach/QuotaExhaustedCard";
import { getRecentConversations } from "@/lib/db/ai";
import type { AIConversation } from "@/lib/types";
import { getPageContext } from "./page-context";
import { usePanelResize } from "./usePanelResize";
import { AICoachHeader, AICoachMobileScrim, AICoachResizeHandle, ConversationHistoryPanel } from "./AICoachPanelParts";
import { MissionWorkspace } from "./missions/MissionWorkspace";
import type { MissionLaunch } from "@/lib/ai-practice/missions/launch";
import { getMission } from "@/lib/ai-practice/missions/registry";
import { isScriptedMission } from "@/lib/ai-practice/missions/types";

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
const QUOTA_WARN_THRESHOLD = 18;

function tabForMission(missionId: string): TabId {
  const mission = getMission(missionId);
  if (!mission) return "chat";
  return isScriptedMission(mission) ? "missions" : "chat";
}

export default function AICoachPanel() {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isOpen, isFullscreen, panelWidth, close, setPanelWidth, launch, consumeLaunch } = useAICoachStore();
  const pathname = usePathname();
  const ctx = getPageContext(pathname);
  const { onDragStart } = usePanelResize({ panelWidth, setPanelWidth });

  const {
    messages, isStreaming, error, quotaExhausted, wordToSave, conversationId,
    activeMissionId, sendMessage, answerToolCall, saveTranslation, openSaveWordModal, closeSaveWordModal,
    confirmSaveWord, saveSaveable, resetSession, finalizeSession, loadConversation, removeConversation,
    changeMode, setMissionIntentHandler,
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
    getRecentConversations(user.id, 30).then(setConversations);
  }, [isOpen, messages.length, conversationId, user?.id]);

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
    transform: isMobile
      ? isOpen ? "translateY(0)" : "translateY(100%)"
      : isOpen ? "translateX(0)" : "translateX(100%)",
    transition: isMobile ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)" : "transform 0.25s ease",
    ...(isMobile ? {} : { width: isFullscreen ? "calc(100vw - var(--sidebar-width))" : `${panelWidth}px` }),
  } as const;

  const renderMission = (exitTab: TabId) => (
    <MissionWorkspace
      missionId={activeMissionId!}
      launch={missionLaunch?.missionId === activeMissionId ? missionLaunch : null}
      setMissionIntentHandler={setMissionIntentHandler}
      messages={messages} isStreaming={isStreaming} isDisabled={quotaExhausted}
      onSendMessage={sendMessage} onSaveWord={openSaveWordModal} onSaveSaveable={saveSaveable}
      onToolAnswer={answerToolCall}
      onExitMission={() => { void changeMode("chat"); setActiveTab(exitTab); }}
    />
  );

  const renderHome = (tab: "chat" | "missions") => (
    <AICoachHome
      activeTab={tab} onSendMessage={sendMessage}
      onSelectMission={(mId) => { void changeMode(`mission:${mId}`); }}
      isStreaming={isStreaming} prefill={inputPrefill} onPrefillConsumed={() => setInputPrefill(undefined)}
    />
  );

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
          onNewChat={() => { resetSession(); setActiveTab("chat"); }}
          onToggleHistory={() => setShowHistory((v) => !v)}
          onClose={() => { finalizeSession(); close(); }}
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
                renderMission("chat")
              ) : !hasMessages ? (
                renderHome("chat")
              ) : (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-border-subtle/60 bg-surface-raised/80 px-3 py-1.5 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => resetSession()}
                      className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-base px-2.5 py-0.5 text-caption font-medium text-fg-muted hover:text-fg hover:border-border-default hover:bg-surface-sunken transition-colors cursor-pointer focus-ring active:scale-[0.98] motion-reduce:transition-none"
                    >
                      <ChevronLeft size={14} aria-hidden />
                      <span>Volver al inicio</span>
                    </button>
                    <span className="text-xxs font-medium text-fg-subtle">Sesión activa</span>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto chat-messages-container" aria-live="polite" aria-label="Mensajes del chat">
                    {error && <ErrorBanner message={error} />}
                    <ChatView
                      messages={messages} isStreaming={isStreaming} onSaveWord={openSaveWordModal} onSaveSaveable={saveSaveable}
                      onSaveTranslation={saveTranslation}
                      onSuggestionClick={(prompt) => setInputPrefill(prompt)} onToolAnswer={answerToolCall} onNext={() => sendMessage("next")}
                      onExerciseComplete={(s) => void sendMessage(`I completed the exercise! I got ${s.correct} of ${s.total} correct.`)}
                    />
                  </div>
                  <div className="shrink-0 px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-base">
                    {quotaExhausted && <QuotaExhaustedCard messages={messages} onNewSession={resetSession} />}
                    {!quotaExhausted && messages.length >= QUOTA_WARN_THRESHOLD && (
                      <div className="flex justify-center mb-2">
                        <span className="text-caption font-medium text-warning bg-warning-soft border border-warning/20 rounded-full px-3 py-0.5">
                          Te estás acercando al límite de la sesión
                        </span>
                      </div>
                    )}
                    <CustomPromptPanel
                      onSubmit={sendMessage} isDisabled={isStreaming || quotaExhausted}
                      variant="chat" placeholder={quotaExhausted ? "Límite de sesión alcanzado" : "Escribe a tu AI Coach..."}
                      prefill={inputPrefill} onPrefillConsumed={() => setInputPrefill(undefined)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Pestaña Misiones */}
            <div className={`flex flex-1 flex-col min-h-0 overflow-hidden${activeTab !== "missions" ? " hidden" : ""}`}>
              {activeMissionId && tabForMission(activeMissionId) === "missions" ? renderMission("missions") : renderHome("missions")}
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
          word={wordToSave.word}
          context={wordToSave.context}
          onConfirm={confirmSaveWord}
          onClose={closeSaveWordModal}
        />
      )}
    </>
  );
}
