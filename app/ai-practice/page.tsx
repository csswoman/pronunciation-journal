"use client";

import { useState } from "react";
import Image from "next/image";
import { useAIPractice } from "@/hooks/useAIPractice";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import Card from "@/components/layout/Card";
import Section from "@/components/layout/Section";
import TemplateGrid from "@/components/ai-practice/TemplateGrid";
import TemplateInputForm from "@/components/ai-practice/TemplateInputForm";
import ChatView from "@/components/ai-practice/ChatView";
import WorkspacePanel from "@/components/ai-practice/WorkspacePanel";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import InlineChatPreview from "@/components/ai-practice/InlineChatPreview";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import SavedAIWords from "@/components/ai-practice/SavedAIWords";
import type { AITemplateId } from "@/lib/types";

const QUICK_ACTIONS = [
  {
    label: "Free conversation",
    icon: "💬",
    prefill: "Let's have a free conversation in English. You start!",
    instant: false,
  },
  {
    label: "Correct my sentence",
    icon: "✏️",
    prefill: 'Please correct this sentence: "',
    instant: false,
  },
  {
    label: "Practice questions",
    icon: "📝",
    prefill: "I want to practice questions about: ",
    instant: false,
  },
  {
    label: "Personalized practice",
    icon: "🎯",
    prefill: null,
    instant: true,
  },
] as const;

export default function AIPracticePage() {
  const {
    phase,
    selectedTemplate,
    messages,
    isStreaming,
    error,
    wordToSave,
    savedWords,
    activeSession,
    selectTemplate,
    submitTemplateVars,
    sendMessage,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
    resetToSelect,
    clearSession,
  } = useAIPractice();

  const [showSavedWords, setShowSavedWords] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [heroPrefill, setHeroPrefill] = useState<string | undefined>(undefined);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Auto-open workspace when a new session arrives
  const [lastSessionTitle, setLastSessionTitle] = useState<string | null>(null);
  if (activeSession && activeSession.title !== lastSessionTitle) {
    setLastSessionTitle(activeSession.title);
    setWorkspaceOpen(true);
  }

  type PreviewMessage = { role: "ai" | "user"; content: string };
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([
    { role: "ai", content: "Hi! What do you want to practice today?" },
  ]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleHeroSubmit = (text: string) => {
    setPreviewMessages((prev) => [...prev, { role: "user", content: text }]);
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewLoading(false);
      setPreviewMessages((prev) => [
        ...prev,
        { role: "ai", content: "Great! Starting your session now..." },
      ]);
      setTimeout(() => {
        submitTemplateVars({ templateId: "free-conversation", topic: text });
      }, 600);
    }, 900);
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (action.instant) {
      submitTemplateVars({ templateId: "personalized-practice" });
    } else if (action.prefill) {
      setHeroPrefill(action.prefill);
    }
  };

  const handleCloseWorkspace = () => {
    setWorkspaceOpen(false);
    clearSession();
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
      <div>
          {/* Error banner */}
          {error && (
            <div
              className="mb-6 p-4 text-sm flex items-start gap-3 rounded-xl border-l-4"
              style={{
                backgroundColor: "var(--btn-regular-bg)",
                borderColor: "var(--admonitions-color-caution)",
                color: "var(--admonitions-color-caution)",
              }}
            >
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Main content ─────────────────────────────── */}
            <div className="flex-1 min-w-0">

              {/* ── Phase: select ── */}
              {phase === "select" && (
                <div className="space-y-6">
                  <div>
                    <h2
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      What do you want to practice?
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      Ask a question, share a sentence, or just start a conversation.
                    </p>
                  </div>

                  <InlineChatPreview messages={previewMessages} isLoading={previewLoading} />

                  <CustomPromptPanel
                    onSubmit={handleHeroSubmit}
                    isDisabled={isStreaming}
                    variant="hero"
                    placeholder="Write a sentence, ask a question, or start a conversation..."
                    helperText="Enter to send · Shift+Enter for new line"
                    prefill={heroPrefill}
                    onPrefillConsumed={() => setHeroPrefill(undefined)}
                  />

                  <div>
                    <p
                      className="text-xs font-medium uppercase tracking-widest mb-3"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Quick start
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleQuickAction(action)}
                          disabled={isStreaming}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all disabled:opacity-40"
                          style={{
                            backgroundColor: "var(--btn-regular-bg)",
                            borderColor: "var(--line-divider)",
                            color: "var(--text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                            e.currentTarget.style.borderColor = "var(--primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                            e.currentTarget.style.borderColor = "var(--line-divider)";
                          }}
                        >
                          <span className="text-base">{action.icon}</span>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: "var(--line-divider)" }}>
                    <button
                      onClick={() => setShowTemplates((v) => !v)}
                      className="flex items-center gap-2 text-sm transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${showTemplates ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Browse all practice modes
                    </button>

                    {showTemplates && (
                      <div className="mt-4">
                        <TemplateGrid onSelect={selectTemplate} />
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-6 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <span>
                      <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {savedWords.length}
                      </span>{" "}
                      saved words
                    </span>
                    <span style={{ color: "var(--primary)" }}>Active today</span>
                  </div>
                </div>
              )}

              {/* ── Phase: configure ── */}
              {phase === "configure" && selectedTemplate && (
                <Section spacing="lg">
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={resetToSelect}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "var(--primary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      aria-label="Go back"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      Set up your session
                    </h2>
                  </div>
                  <Card className="p-8">
                    <TemplateInputForm
                      templateId={selectedTemplate as AITemplateId}
                      onSubmit={submitTemplateVars}
                      onBack={resetToSelect}
                      isLoading={isStreaming}
                    />
                  </Card>
                </Section>
              )}

              {/* ── Phase: chat ── */}
              {phase === "chat" && (
                <div className="flex flex-col gap-4">
                  {/* Chat header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={resetToSelect}
                      className="flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      New session
                    </button>

                    <div className="flex items-center gap-2">
                      {activeSession && !workspaceOpen && (
                        <button
                          onClick={() => setWorkspaceOpen(true)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                          style={{
                            backgroundColor: "var(--btn-regular-bg)",
                            borderColor: "var(--primary)",
                            color: "var(--primary)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          Open practice
                        </button>
                      )}
                      <span
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: "var(--btn-regular-bg)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        Select any word to save it
                      </span>
                    </div>
                  </div>

                  {/* Chat + Workspace split */}
                  <div className={`flex gap-4 ${workspaceOpen ? "flex-col lg:flex-row" : ""}`}>
                    {/* Chat panel */}
                    <div className={workspaceOpen ? "lg:w-[45%] flex-shrink-0" : "w-full"}>
                      <div
                        className="rounded-2xl overflow-hidden border"
                        style={{ borderColor: "var(--line-divider)" }}
                      >
                        <div
                          className="min-h-[380px] max-h-[520px] overflow-y-auto px-5 py-4"
                          style={{ backgroundColor: "var(--card-bg)" }}
                        >
                          <ChatView
                            messages={messages}
                            isStreaming={isStreaming}
                            onSaveWord={openSaveWordModal}
                            hasActiveSession={!!activeSession && !workspaceOpen}
                            onOpenWorkspace={() => setWorkspaceOpen(true)}
                          />
                        </div>
                      </div>

                      {/* Reply input */}
                      <div className="mt-3">
                        <CustomPromptPanel
                          onSubmit={sendMessage}
                          isDisabled={isStreaming}
                          variant="chat"
                          placeholder="Reply… (Enter to send)"
                        />
                      </div>
                    </div>

                    {/* Workspace panel */}
                    {workspaceOpen && activeSession && (
                      <div className="flex-1 min-w-0">
                        <WorkspacePanel
                          session={activeSession}
                          onClose={handleCloseWorkspace}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ───────────────────────────────────── */}
            <div className="lg:w-60 flex-shrink-0">
              <Card className="sticky top-20 p-0 overflow-hidden">
                <button
                  onClick={() => setShowSavedWords((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors border-b"
                  style={{
                    color: "var(--text-primary)",
                    borderColor: "var(--line-divider)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📚</span>
                    <span className="text-sm font-medium">Saved Words</span>
                    {savedWords.length > 0 && (
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                        style={{ background: "var(--primary)", color: "white" }}
                      >
                        {savedWords.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${showSavedWords ? "rotate-180" : ""}`}
                    style={{ color: "var(--text-tertiary)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`${showSavedWords ? "block" : "hidden"} lg:block`}>
                  {savedWords.length === 0 ? (
                    <div className="p-5 text-center">
                      <div className="text-2xl mb-2 opacity-30">✨</div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                        Words you save during practice will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <SavedAIWords words={savedWords} onDelete={deleteSavedWord} />
                    </div>
                  )}
                </div>
              </Card>

              {phase === "select" && (
                <Card className="mt-4 p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base opacity-60 mt-0.5">💡</span>
                    <div>
                      <h3
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Tip
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Try practicing a new word in a sentence to move it to your mastered list.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
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
