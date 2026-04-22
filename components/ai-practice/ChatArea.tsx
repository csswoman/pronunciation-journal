"use client";

import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import type { AIConversationMode } from "@/lib/types";
import ChatTabs, { type TabId } from "./ChatTabs";
import ChatView from "./ChatView";
import RoleplayView from "./RoleplayView";
import PronunciationView from "./PronunciationView";
import CustomPromptPanel from "./CustomPromptPanel";
import ErrorBanner from "./ErrorBanner";

// Maps tab id → default AIConversationMode
const TAB_TO_MODE: Record<TabId, AIConversationMode> = {
  chat: "chat",
  roleplay: "roleplay:cafe",
  pronunciation: "pronunciation",
};

// Maps mode → tab id (for controlled active tab)
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
  mode: AIConversationMode;
  onChangeMode: (mode: AIConversationMode) => Promise<void>;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onSubmit: (text: string) => void;
  inputPrefill?: string;
  onPrefillConsumed: () => void;
}

export default function ChatArea({
  messages,
  isStreaming,
  error,
  mode,
  onChangeMode,
  onSaveWord,
  onSuggestionClick,
  onToolAnswer,
  onSubmit,
  inputPrefill,
  onPrefillConsumed,
}: ChatAreaProps) {
  const activeTab = modeToTab(mode);

  function handleTabChange(tab: TabId) {
    onChangeMode(TAB_TO_MODE[tab]);
  }

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-hidden border-l border-r"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <ChatTabs active={activeTab} onChange={handleTabChange} />

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
          <div className="flex-1 overflow-y-auto px-2">
            {error && <ErrorBanner message={error} />}
            <ChatView
              messages={messages}
              isStreaming={isStreaming}
              onSaveWord={onSaveWord}
              onSuggestionClick={onSuggestionClick}
              onToolAnswer={onToolAnswer}
              onSendMessage={onSubmit}
            />
          </div>

          <div
            className="flex-shrink-0 p-3 border-t"
            style={{ borderColor: "var(--line-divider)" }}
          >
            <CustomPromptPanel
              onSubmit={onSubmit}
              isDisabled={isStreaming}
              variant="chat"
              placeholder="Write in English... (Enter to send)"
              prefill={inputPrefill}
              onPrefillConsumed={onPrefillConsumed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
