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
  roleplay: "roleplay:cafe",
  pronunciation: "pronunciation",
};

function modeToTab(mode: AIConversationMode): TabId {
  if (mode === "chat") return "chat";
  if (mode === "pronunciation") return "pronunciation";
  if (mode.startsWith("roleplay:")) return "roleplay";
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
          className="flex items-center gap-1.5 text-caption font-medium px-2 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
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
          className="flex items-center gap-1.5 text-caption font-medium px-2 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
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
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-tiny font-semibold"
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
      {activeTab === "roleplay" ? (
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
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
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
            <div className="flex-shrink-0 px-4 pb-3 pt-2">
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
