"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  } = useAIPractice();

  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<AIConversation[]>([]);

  useEffect(() => {
    getRecentConversations(30).then(setConversations);
  }, [messages.length]);

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
          className="flex rounded-2xl overflow-hidden border"
          style={{
            borderColor: "var(--line-divider)",
            backgroundColor: "var(--card-bg)",
            height: "min(680px, 72vh)",
          }}
        >
          <AIPracticeSidebar
            grouped={groupConversationsByDate(conversations)}
            onNewSession={resetSession}
            activeConversationId={conversationId}
          />

          <ChatArea
            messages={messages}
            isStreaming={isStreaming}
            error={error}
            mode={mode}
            onChangeMode={changeMode}
            onSaveWord={openSaveWordModal}
            onSuggestionClick={(text) => setInputPrefill(text)}
            onToolAnswer={answerToolCall}
            onSubmit={sendMessage}
            inputPrefill={inputPrefill}
            onPrefillConsumed={() => setInputPrefill(undefined)}
          />

          <AIVocabPanel
            words={savedWords}
            onDelete={deleteSavedWord}
            onGeneratePractice={() => sendMessage("Give me a personalized practice exercise")}
            onGenerateWithWords={() => {
              const wordList = savedWords.slice(0, 8).map((w) => w.word).join(", ");
              if (wordList) sendMessage(`Let's practice with these words: ${wordList}`);
            }}
          />
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
