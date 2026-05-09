"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Maximize2, Minimize2, Plus, History, ChevronLeft } from "lucide-react";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { useAIPractice } from "@/hooks/useAIPractice";
import ChatView from "@/components/ai-practice/ChatView";
import PronunciationView from "@/components/ai-practice/PronunciationView";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import ChatTabs, { type TabId } from "@/components/ai-practice/ChatTabs";
import AICoachHome from "@/components/ai-coach/AICoachHome";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import ErrorBanner from "@/components/ai-practice/ErrorBanner";
import QuotaExhaustedCard from "@/components/ai-practice/QuotaExhaustedCard";
import { getRecentConversations } from "@/lib/ai-db";
import { groupConversationsByDate } from "@/lib/group-by-date";
import type { AIConversation } from "@/lib/types";

export const PANEL_WIDTH = 380;
const MIN_WIDTH = 320;
const MAX_WIDTH = 760;

// ── Page context ───────────────────────────────────────────────────────────────

interface PageContext {
  label: string;
  chips: { label: string; prompt: string }[];
}

function getPageContext(pathname: string): PageContext {
  const universal = [
    { label: "Correct my text", prompt: "Please correct the following text: " },
    { label: "Free conversation", prompt: "Let's have a free conversation in English" },
  ];
  if (pathname === "/" || pathname === "/dashboard") {
    return { label: "🏠 Home", chips: [
      { label: "What should I practice?", prompt: "What should I practice today based on my learning progress?" },
      { label: "Word of the day", prompt: "Can you give me a word of the day and explain it with examples?" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/words") || pathname.startsWith("/decks")) {
    return { label: "📖 Word Bank", chips: [
      { label: "Use it in a sentence", prompt: "Use this word in a sentence and explain when to use it" },
      { label: "Similar words?", prompt: "What's the difference between this word and similar words?" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/practice") || pathname.startsWith("/ipa") || pathname.startsWith("/review")) {
    return { label: "🎯 Practice", chips: [
      { label: "Explain this sound", prompt: "Explain this English phoneme and how to pronounce it correctly" },
      { label: "More words to practice", prompt: "Give me more words to practice with this sound" },
      ...universal,
    ]};
  }
  if (pathname.startsWith("/lessons")) {
    return { label: "📚 Lessons", chips: [
      { label: "Explain this topic", prompt: "Can you explain this grammar topic in more detail with examples?" },
      { label: "Give me examples", prompt: "Give me more examples of this grammar concept" },
      ...universal,
    ]};
  }
  return { label: "✦ AI Coach", chips: universal };
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function AICoachPanel() {
  const { isOpen, isFullscreen, panelWidth, close, setFullscreen, setPanelWidth } = useAICoachStore();
  const pathname = usePathname();
  const ctx = getPageContext(pathname);

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = dragStartX.current - e.clientX;
    const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
    setPanelWidth(next);
  }, [setPanelWidth]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [panelWidth, onMouseMove, onMouseUp]);

  const {
    messages,
    isStreaming,
    error,
    quotaExhausted,
    wordToSave,
    conversationId,
    sendMessage,
    answerToolCall,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    resetSession,
    loadConversation,
    removeConversation,
  } = useAIPractice();

  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<AIConversation[]>([]);

  // Reset to chat tab when panel opens
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setActiveTab("chat");
      setShowHistory(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    getRecentConversations(30).then(setConversations);
  }, [messages.length, conversationId]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
  }

  function handleSelectConversation(conv: AIConversation) {
    loadConversation(conv);
    setShowHistory(false);
    setActiveTab("chat");
  }

  async function handleDeleteConversation(id: number) {
    await removeConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  const hasMessages = messages.filter((m) => m.role !== "tool").length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: isFullscreen ? "calc(100vw - 256px)" : `${panelWidth}px`,
    backgroundColor: "var(--card-bg)",
    borderLeft: "1px solid var(--line-divider)",
    display: "flex",
    flexDirection: "column",
    zIndex: 50,
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: isDragging.current ? "transform 0.25s ease" : "transform 0.25s ease, width 0.25s ease",
    boxShadow: "-4px 0 24px color-mix(in oklch, var(--fg) 6%, transparent)",
  };

  return (
    <>
      <div style={panelStyle} aria-hidden={!isOpen}>
        {/* Drag handle */}
        {!isFullscreen && (
          <div
            onMouseDown={onDragStart}
            title="Drag to resize"
            className="absolute top-0 left-0 bottom-0 w-1 cursor-ew-resize group z-10"
            style={{ marginLeft: "-1px" }}
          >
            <div
              className="absolute inset-y-0 left-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "var(--primary)" }}
            />
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-3 py-2.5 flex-shrink-0 border-b"
          style={{ borderColor: "var(--line-divider)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                backgroundColor: "color-mix(in oklch, var(--primary) 15%, transparent)",
                color: "var(--primary)",
              }}
            >
              ✦
            </span>
            <span className="text-sm font-semibold text-fg">AI Coach</span>
            <span
              className="text-tiny px-2 py-0.5 rounded-full font-medium hidden sm:inline"
              style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-tertiary)" }}
            >
              {ctx.label}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <PanelIconButton
              onClick={() => { resetSession(); setActiveTab("chat"); }}
              title="New chat"
            >
              <Plus size={14} />
            </PanelIconButton>
            <PanelIconButton
              onClick={() => setShowHistory((v) => !v)}
              title="Conversation history"
              active={showHistory}
            >
              <History size={14} />
            </PanelIconButton>
            <PanelIconButton
              onClick={() => setFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </PanelIconButton>
            <PanelIconButton onClick={close} title="Close panel">
              <X size={14} />
            </PanelIconButton>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0">
          <ChatTabs active={activeTab} onChange={handleTabChange} />
        </div>

        {/* ── History panel ────────────────────────────────────────────────── */}
        {showHistory && (
          <ConversationHistory
            conversations={conversations}
            activeId={conversationId}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {!showHistory && (
          <>
            {activeTab === "interview" ? (
              <AICoachHome
                activeTab="interview"
                onSendMessage={sendMessage}
                isStreaming={isStreaming}
                prefill={inputPrefill}
                onPrefillConsumed={() => setInputPrefill(undefined)}
              />
            ) : activeTab === "pronunciation" ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <PronunciationView />
              </div>
            ) : /* chat */ !hasMessages ? (
              <AICoachHome
                activeTab="chat"
                onSendMessage={sendMessage}
                isStreaming={isStreaming}
                prefill={inputPrefill}
                onPrefillConsumed={() => setInputPrefill(undefined)}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  {error && <ErrorBanner message={error} />}
                  <ChatView
                    messages={messages}
                    isStreaming={isStreaming}
                    onSaveWord={openSaveWordModal}
                    onSuggestionClick={(p) => setInputPrefill(p)}
                    onToolAnswer={answerToolCall}
                    onSendMessage={sendMessage}
                    onNext={() => sendMessage("next")}
                  />
                </div>
                <div className="flex-shrink-0 px-3 pb-3 pt-1 bg-surface-base">
                  {quotaExhausted ? (
                    <QuotaExhaustedCard messages={messages} onNewSession={resetSession} />
                  ) : (
                    <CustomPromptPanel
                      onSubmit={sendMessage}
                      isDisabled={isStreaming}
                      variant="chat"
                      placeholder="Ask your AI Coach..."
                      prefill={inputPrefill}
                      onPrefillConsumed={() => setInputPrefill(undefined)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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

// ── Sub-components ─────────────────────────────────────────────────────────────

function PanelIconButton({
  onClick, title, active, children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
      style={{
        color: active ? "var(--primary)" : "var(--text-tertiary)",
        backgroundColor: active
          ? "color-mix(in oklch, var(--primary) 12%, transparent)"
          : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary)";
        }
      }}
    >
      {children}
    </button>
  );
}

function ConversationHistory({
  conversations, activeId, onSelect, onDelete, onClose,
}: {
  conversations: AIConversation[];
  activeId: number | null;
  onSelect: (conv: AIConversation) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const grouped = groupConversationsByDate(conversations);
  const GROUP_ORDER = ["TODAY", "YESTERDAY", "7 DAYS", "OLDER"] as const;
  const isEmpty = GROUP_ORDER.every((l) => grouped[l].length === 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg transition-colors"
        >
          <ChevronLeft size={13} />
          Back
        </button>
        <span className="text-xs font-medium text-fg ml-1">History</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {isEmpty ? (
          <p className="text-xs text-fg-subtle text-center py-8">No conversations yet</p>
        ) : (
          GROUP_ORDER.map((label) => {
            const items = grouped[label];
            if (!items?.length) return null;
            return (
              <div key={label} className="mb-3">
                <p
                  className="text-tiny font-semibold uppercase tracking-widest px-3 py-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {label}
                </p>
                {items.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeId}
                    onSelect={() => onSelect(conv)}
                    onDelete={() => conv.id !== undefined && onDelete(conv.id)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ConvItem({
  conv, isActive, onSelect, onDelete,
}: {
  conv: AIConversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const firstUserMsg = conv.messages.find((m) => m.role === "user");
  const preview =
    typeof firstUserMsg?.content === "string"
      ? firstUserMsg.content.slice(0, 48)
      : "Untitled conversation";

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors"
      style={{
        backgroundColor: isActive
          ? "color-mix(in oklch, var(--primary) 10%, transparent)"
          : "transparent",
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span
        className="text-xs truncate flex-1"
        style={{ color: isActive ? "var(--primary)" : "var(--text-secondary)" }}
      >
        {preview}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        title="Delete"
      >
        <X size={11} />
      </button>
    </div>
  );
}
