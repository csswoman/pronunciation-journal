"use client";

import { useState } from "react";
import type { AIMessage, LearningSession } from "@/lib/types";
import ChatTabs, { type TabId } from "./ChatTabs";
import ChatView from "./ChatView";
import RoleplayView from "./RoleplayView";
import PronunciationView from "./PronunciationView";
import InlineSession from "./InlineSession";
import CustomPromptPanel from "./CustomPromptPanel";
import ErrorBanner from "./ErrorBanner";

interface ChatAreaProps {
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  activeSession: LearningSession | null;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onSubmit: (text: string) => void;
  inputPrefill?: string;
  onPrefillConsumed: () => void;
}

export default function ChatArea({
  messages,
  isStreaming,
  error,
  activeSession,
  onSaveWord,
  onSuggestionClick,
  onSubmit,
  inputPrefill,
  onPrefillConsumed,
}: ChatAreaProps) {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-hidden border-l border-r"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <ChatTabs active={activeTab} onChange={setActiveTab} />

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
              activeSession={activeSession}
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

          {activeSession && !isStreaming && (
            <InlineSession
              session={activeSession}
              onExit={() => onSubmit("")}
            />
          )}
        </div>
      )}
    </div>
  );
}
