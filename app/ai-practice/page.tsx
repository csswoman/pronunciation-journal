"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Users, TrendingUp, Heart } from "lucide-react";
import { useAIPractice } from "@/hooks/useAIPractice";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import ChatArea from "@/components/ai-practice/ChatArea";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import AIPracticeSidebar from "@/components/ai-practice/AIPracticeSidebar";
import AIVocabPanel from "@/components/ai-practice/AIVocabPanel";
import { getRecentConversations } from "@/lib/ai-db";
import { groupConversationsByDate } from "@/lib/group-by-date";
import type { AIConversation } from "@/lib/types";

export default function AIPracticePage() {
  const {
    messages,
    isStreaming,
    error,
    quotaExhausted,
    wordToSave,
    savedWords,
    mode,
    conversationId,
    sendMessage,
    answerToolCall,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
    resetSession,
    changeMode,
    loadConversation,
    removeConversation,
  } = useAIPractice();

  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [sessionsCollapsed, setSessionsCollapsed] = useState(false);
  const [vocabCollapsed, setVocabCollapsed] = useState(false);

  useEffect(() => {
    getRecentConversations(30).then(setConversations);
  }, [messages.length, conversationId]);

  return (
    <>
      <PageLayout
        hero={
          <PageHeader
            badge="AI Tutor"
            title="Practice with"
            subtitle="your AI coach"
            description="Chat, learn, and get instant help in English."
            variant="default"
            illustration={
              <Image
                src="/illustrations/chat-ai.svg"
                alt="AI chat illustration"
                width={560}
                height={360}
                priority
              />
            }
          />
        }
      >
        <div
          className="flex flex-col gap-0 rounded-2xl overflow-hidden border"
          style={{
            borderColor: "var(--line-divider)",
            backgroundColor: "var(--card-bg)",
            height: "min(720px, 76vh)",
          }}
        >
        <div className="flex flex-1 min-h-0">
          <AIPracticeSidebar
            grouped={groupConversationsByDate(conversations)}
            onNewSession={resetSession}
            onSelectConversation={loadConversation}
            onDeleteConversation={async (id) => {
              await removeConversation(id);
              setConversations((prev) => prev.filter((c) => c.id !== id));
            }}
            activeConversationId={conversationId}
            collapsed={sessionsCollapsed}
          />

          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            quotaExhausted={quotaExhausted}
            onNewSession={resetSession}
            mode={mode}
            onChangeMode={changeMode}
            onSaveWord={openSaveWordModal}
            onSuggestionClick={(text) => setInputPrefill(text)}
            onToolAnswer={answerToolCall}
            onSubmit={sendMessage}
            inputPrefill={inputPrefill}
            onPrefillConsumed={() => setInputPrefill(undefined)}
            vocabCount={savedWords.length}
            sessionsCollapsed={sessionsCollapsed}
            vocabCollapsed={vocabCollapsed}
            onToggleSessions={() => setSessionsCollapsed(v => !v)}
            onToggleVocab={() => setVocabCollapsed(v => !v)}
          />

          <AIVocabPanel
            words={savedWords}
            onDelete={deleteSavedWord}
            onGeneratePractice={() => sendMessage("Give me a personalized practice exercise")}
            onGenerateWithWords={() => {
              const wordList = savedWords.slice(0, 8).map((w) => w.word).join(", ");
              if (wordList) sendMessage(`Let's practice with these words: ${wordList}`);
            }}
            collapsed={vocabCollapsed}
          />
        </div>

        <FeatureFooter />
        </div>
      </PageLayout>

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

const FEATURES = [
  { icon: Sparkles, label: "AI-powered feedback" },
  { icon: Users, label: "Personalized practice" },
  { icon: TrendingUp, label: "Track your progress" },
  { icon: Heart, label: "Improve every day" },
];

function FeatureFooter() {
  return (
    <div
      className="flex items-center justify-center gap-6 px-4 py-2.5 border-t flex-shrink-0"
      style={{ borderColor: "var(--line-divider)" }}
    >
      {FEATURES.map(({ icon: Icon, label }, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Icon size={12} style={{ color: "var(--primary)" }} />
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
