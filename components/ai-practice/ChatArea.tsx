"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { AIConversationMode } from "@/lib/types";
import ChatTabs, { type TabId } from "./ChatTabs";
import ChatView from "./ChatView";
import RoleplayView from "./RoleplayView";
import PronunciationView from "./PronunciationView";
import CustomPromptPanel from "./CustomPromptPanel";
import ErrorBanner from "./ErrorBanner";
import QuotaExhaustedCard from "./QuotaExhaustedCard";

const TAB_TO_MODE: Record<TabId, AIConversationMode> = {
  chat: "chat",
  interview: "roleplay:interview",
  pronunciation: "pronunciation",
};

function modeToTab(mode: AIConversationMode): TabId {
  if (mode === "chat") return "chat";
  if (mode === "pronunciation") return "pronunciation";
  if (mode.startsWith("roleplay:")) return "interview";
  return "chat";
}

interface ChatAreaProps {
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  quotaExhausted?: boolean;
  mode: AIConversationMode;
  onChangeMode: (mode: AIConversationMode) => Promise<void>;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onSubmit: (text: string) => void;
  onNewSession?: () => void;
  inputPrefill?: string;
  onPrefillConsumed: () => void;
  vocabCount?: number;
  sessionsCollapsed?: boolean;
  vocabCollapsed?: boolean;
  onToggleSessions?: () => void;
  onToggleVocab?: () => void;
}

export default function ChatArea({
  messages,
  isStreaming,
  error,
  quotaExhausted = false,
  mode,
  onChangeMode,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
  onSubmit,
  onNewSession,
  inputPrefill,
  onPrefillConsumed,
  vocabCount = 0,
  sessionsCollapsed = false,
  vocabCollapsed = false,
  onToggleSessions,
  onToggleVocab,
}: ChatAreaProps) {
  const activeTab = modeToTab(mode);

  function handleTabChange(tab: TabId) {
    onChangeMode(TAB_TO_MODE[tab]);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-l border-r" style={{ borderColor: "var(--line-divider)" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <button
          onClick={onToggleSessions}
          aria-label={sessionsCollapsed ? "Show sessions" : "Hide sessions"}
          className="flex items-center gap-1.5 text-caption font-medium px-2 py-1.5 rounded-lg transition-colors text-fg-subtle"
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          {sessionsCollapsed ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
          Sessions
        </button>

        <ChatTabs active={activeTab} onChange={handleTabChange} />

        <button
          onClick={onToggleVocab}
          aria-label={vocabCollapsed ? "Show vocab" : "Hide vocab"}
          className="flex items-center gap-1.5 text-caption font-medium px-2 py-1.5 rounded-lg transition-colors text-fg-subtle"
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          Vocab
          <span
            className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-tiny font-semibold"
            style={{
              backgroundColor: vocabCount > 0 ? "color-mix(in oklch, var(--primary) 14%, transparent)" : "var(--btn-regular-bg)",
              color: vocabCount > 0 ? "var(--primary)" : "var(--text-tertiary)",
            }}
          >
            {vocabCount}
          </span>
          {vocabCollapsed ? <ChevronLeft size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
        </button>
      </div>

      {/* Content */}
      {activeTab === "interview" ? (
        <RoleplayView
          messages={messages}
          isStreaming={isStreaming}
          onSaveWord={onSaveWord}
          onSuggestionClick={onSuggestionClick}
          onSubmit={onSubmit}
          inputPrefill={inputPrefill}
          onPrefillConsumed={onPrefillConsumed}
        />
      ) : activeTab === "pronunciation" ? (
        <PronunciationView />
      ) : (
        <div
          className="relative flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{
            background: "oklch(0.11 0.005 var(--hue))",
            backgroundImage: `
              radial-gradient(ellipse 90% 40% at 50% 0%,
                color-mix(in oklch, var(--primary) 22%, transparent),
                transparent 65%
              ),
              radial-gradient(ellipse 50% 30% at 90% 80%,
                color-mix(in oklch, var(--primary) 8%, transparent),
                transparent 60%
              ),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1.2' fill='oklch(1 0 0 / 0.055)'/%3E%3C/svg%3E")
            `,
            backgroundSize: "cover, cover, 24px 24px",
          }}
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && <ErrorBanner message={error} />}
            <ChatView
              messages={messages}
              isStreaming={isStreaming}
              onSaveWord={onSaveWord}
              onSuggestionClick={onSuggestionClick}
              onToolAnswer={onToolAnswer}
              onSendMessage={onSubmit}
              onNext={() => onSubmit("next")}
            />
          </div>
          {quotaExhausted ? (
            <QuotaExhaustedCard
              messages={messages}
              onNewSession={onNewSession ?? (() => {})}
            />
          ) : (
            <div
              className="flex-shrink-0 px-5 pb-3 pt-2 backdrop-blur-md"
              style={{
                borderTop: "1px solid oklch(1 0 0 / 0.08)",
                background: "oklch(0.14 0.008 var(--hue) / 0.85)",
              }}
            >
              <CustomPromptPanel
                onSubmit={onSubmit}
                isDisabled={isStreaming}
                variant="chat"
                placeholder="Write in English... or hold mic to speak"
                prefill={inputPrefill}
                onPrefillConsumed={onPrefillConsumed}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
