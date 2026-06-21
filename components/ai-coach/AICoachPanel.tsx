"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { useAIPractice } from "@/hooks/useAIPractice";
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
import { AICoachHeader, ConversationHistoryPanel } from "./AICoachPanelParts";

export const PANEL_WIDTH = 380;

const QUOTA_WARN_THRESHOLD = 18;

export default function AICoachPanel() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isOpen, isFullscreen, panelWidth, close, setPanelWidth, launch, consumeLaunch } =
    useAICoachStore();
  const pathname = usePathname();
  const ctx = getPageContext(pathname);
  const { onDragStart } = usePanelResize({ panelWidth, setPanelWidth });

  const { messages, isStreaming, error, quotaExhausted, wordToSave, conversationId, sendMessage, answerToolCall, openSaveWordModal, closeSaveWordModal, confirmSaveWord, resetSession, finalizeSession, loadConversation, removeConversation } = useAIPractice();

  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<AIConversation[]>([]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }

    const justOpened = !wasOpen.current;
    wasOpen.current = true;

    if (justOpened) setShowHistory(false);

    if (launch) {
      if (launch.tab) setActiveTab(launch.tab);
      if (launch.prefill) setInputPrefill(launch.prefill);
      consumeLaunch();
    } else if (justOpened) {
      setActiveTab("chat");
    }
  }, [isOpen, launch, consumeLaunch]);

  useEffect(() => {
    getRecentConversations(30).then(setConversations);
  }, [messages.length, conversationId]);

  const hasMessages = messages.some((message) => {
    if (message.role === "tool") return false;
    if (message.role === "user" && message.hidden) return false;
    return true;
  }) || isStreaming;

  return <>
    <div
      className={`fixed z-50 flex flex-col bg-surface-raised shadow-lg
        max-md:inset-0 max-md:border-0
        md:top-0 md:right-0 md:bottom-0 md:border-l md:border-border-subtle`}
      style={{
        // mobile: slide up from bottom; desktop: slide in from right
        transform: isMobile
          ? isOpen ? "translateY(0)" : "translateY(100%)"
          : isOpen ? "translateX(0)" : "translateX(100%)",
        transition: isMobile
          ? "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 0.25s ease",
        // width only applies on desktop; on mobile inset-0 handles sizing
        ...(isMobile ? {} : {
          width: isFullscreen ? "calc(100vw - var(--sidebar-width))" : `${panelWidth}px`,
        }),
      }}
      aria-hidden={!isOpen}
    >
      {!isFullscreen && !isMobile && <div onMouseDown={onDragStart} title="Drag to resize" className="absolute top-0 left-0 bottom-0 w-1 cursor-ew-resize group z-10 -ml-px"><div className="absolute inset-y-0 left-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary" /></div>}
      <AICoachHeader pageLabel={ctx.label} showHistory={showHistory} onNewChat={() => { resetSession(); setActiveTab("chat"); }} onToggleHistory={() => setShowHistory((value) => !value)} onClose={() => { finalizeSession(); close(); }} />
      <div className="flex-shrink-0"><ChatTabs active={activeTab} onChange={setActiveTab} /></div>

      {showHistory && <ConversationHistoryPanel conversations={conversations} activeId={conversationId} onSelect={(conv) => { loadConversation(conv); setShowHistory(false); setActiveTab("chat"); }} onDelete={async (id) => { await removeConversation(id); setConversations((prev) => prev.filter((item) => item.id !== id)); }} onClose={() => setShowHistory(false)} />}

      {!showHistory && (
        <>
          {/* Chat tab — kept mounted to preserve PracticeSession state */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden${activeTab !== "chat" ? " hidden" : ""}`}>
            {!hasMessages
              ? <AICoachHome activeTab="chat" onSendMessage={sendMessage} isStreaming={isStreaming} prefill={inputPrefill} onPrefillConsumed={() => setInputPrefill(undefined)} />
              : <>
                  <div className="flex-1 overflow-y-auto" aria-live="polite" aria-label="Chat messages">
                    {error && <ErrorBanner message={error} />}
                    <ChatView messages={messages} isStreaming={isStreaming} onSaveWord={openSaveWordModal} onSuggestionClick={(prompt) => setInputPrefill(prompt)} onToolAnswer={answerToolCall} onNext={() => sendMessage("next")} />
                  </div>
                  <div className="flex-shrink-0 px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-base">
                    {quotaExhausted && <QuotaExhaustedCard messages={messages} onNewSession={resetSession} />}
                    {!quotaExhausted && messages.length >= QUOTA_WARN_THRESHOLD && (
                      <div className="flex justify-center mb-2">
                        <span className="text-[11px] text-[var(--warning)] bg-[var(--warning-soft)] rounded-full px-2.5 py-1">
                          You're approaching your session limit
                        </span>
                      </div>
                    )}
                    <CustomPromptPanel
                      onSubmit={sendMessage}
                      isDisabled={isStreaming || quotaExhausted}
                      variant="chat"
                      placeholder={quotaExhausted ? "Session limit reached" : "Ask your AI Coach..."}
                      prefill={inputPrefill}
                      onPrefillConsumed={() => setInputPrefill(undefined)}
                    />
                  </div>
                </>
            }
          </div>

          {/* Interview tab — kept mounted */}
          <div className={`flex flex-1 flex-col min-h-0 overflow-hidden${activeTab !== "interview" ? " hidden" : ""}`}>
            <AICoachHome activeTab="interview" onSendMessage={sendMessage} isStreaming={isStreaming} prefill={inputPrefill} onPrefillConsumed={() => setInputPrefill(undefined)} />
          </div>

          {/* Pronunciation tab — kept mounted */}
          <div className={`flex-1 min-h-0 overflow-hidden${activeTab !== "pronunciation" ? " hidden" : ""}`}>
            <PronunciationView />
          </div>
        </>
      )}
    </div>

    {wordToSave && <SaveWordModal word={wordToSave.word} context={wordToSave.context} onConfirm={confirmSaveWord} onClose={closeSaveWordModal} />}
  </>;
}
