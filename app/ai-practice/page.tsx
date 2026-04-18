"use client";

import { useState } from "react";
import Image from "next/image";
import { useAIPractice } from "@/hooks/useAIPractice";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import ChatView from "@/components/ai-practice/ChatView";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import ChatHeader from "@/components/ai-practice/ChatHeader";
import ErrorBanner from "@/components/ai-practice/ErrorBanner";

export default function AIPracticePage() {
  const {
    messages,
    isStreaming,
    error,
    wordToSave,
    activeSession,
    submitTemplateVars,
    sendMessage,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    resetToSelect,
  } = useAIPractice();

  const [inputPrefill, setInputPrefill] = useState<string | undefined>(undefined);

  const hasMessages = messages.length > 0;

  const handleSubmit = (text: string) => {
    if (!hasMessages) {
      submitTemplateVars({ templateId: "free-conversation", topic: text });
    } else {
      sendMessage(text);
    }
  };

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
                width={613}
                height={349}
                priority
                className="w-[300px] xl:w-[340px] h-auto"
              />
            }
          />
        }
      >
      <div className="max-w-2xl mx-auto w-full">
        <div
          className="flex flex-col rounded-2xl overflow-hidden border"
          style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
        >
        <ChatHeader hasMessages={hasMessages} onReset={resetToSelect} />
        {error && <ErrorBanner message={error} />}

        {/* Message list */}
        <div className="px-2">
          <ChatView
            messages={messages}
            isStreaming={isStreaming}
            onSaveWord={openSaveWordModal}
            onSuggestionClick={(text) => setInputPrefill(text)}
            activeSession={activeSession}
          />
        </div>

        {/* Input */}
        <div className="p-3 border-t" style={{ borderColor: "var(--line-divider)" }}>
          <CustomPromptPanel
            onSubmit={handleSubmit}
            isDisabled={isStreaming}
            variant="chat"
            placeholder="Type in English… (Enter to send)"
            prefill={inputPrefill}
            onPrefillConsumed={() => setInputPrefill(undefined)}
          />
        </div>
        </div>
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
