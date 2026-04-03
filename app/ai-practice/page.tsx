"use client";

import { useState } from "react";
import Link from "next/link";
import { useAIPractice } from "@/hooks/useAIPractice";
import TemplateGrid from "@/components/ai-practice/TemplateGrid";
import TemplateInputForm from "@/components/ai-practice/TemplateInputForm";
import ChatView from "@/components/ai-practice/ChatView";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import SavedAIWords from "@/components/ai-practice/SavedAIWords";

export default function AIPracticePage() {
  const {
    phase,
    selectedTemplate,
    messages,
    isStreaming,
    error,
    wordToSave,
    savedWords,
    selectTemplate,
    submitTemplateVars,
    sendMessage,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
    resetToSelect,
  } = useAIPractice();

  const [showSavedWords, setShowSavedWords] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <header className="text-white" style={{background: 'var(--card-bg)'}}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="transition-colors"
              style={{color: 'rgba(255,255,255,0.8)'}}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">AI Practice</h1>
          </div>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>
            Your personal English tutor — exercises, corrections & conversation
            </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2" style={{
                backgroundColor: 'var(--btn-regular-bg)',
                borderColor: 'var(--admonitions-color-caution)',
                borderWidth: '1px',
                color: 'var(--admonitions-color-caution)',
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Phase: select */}
            {phase === "select" && (
              <div className="space-y-8">
                <TemplateGrid onSelect={selectTemplate} />

                {/* Custom prompt section */}
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      ✍️ Custom Prompt
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Write your own instruction for the AI tutor.
                    </p>
                  </div>
                  <CustomPromptPanel
                    onSubmit={(text) => {
                      // Treat custom prompt as a direct first message with no system prompt
                      submitTemplateVars({ templateId: "practice-questions", topic: text, userLevel: "intermediate" });
                    }}
                    isDisabled={isStreaming}
                    placeholder="e.g. Give me 5 phrasal verbs with 'get' and example sentences..."
                  />
                </div>
              </div>
            )}

            {/* Phase: configure */}
            {phase === "configure" && selectedTemplate && (
              <div className="bg-card-bg rounded-2xl border border-line-divider p-6">
                <TemplateInputForm
                  templateId={selectedTemplate as import("@/lib/types").AITemplateId}
                  onSubmit={submitTemplateVars}
                  onBack={resetToSelect}
                  isLoading={isStreaming}
                />
              </div>
            )}

            {/* Phase: chat */}
            {phase === "chat" && (
              <div className="space-y-4">
                {/* Back + new session button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetToSelect}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{
                      color: 'var(--primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--btn-regular-bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    New session
                  </button>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Select any word in a response to save it
                  </span>
                </div>

                {/* Chat messages */}
                <div className="bg-btn-regular rounded-2xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                  <ChatView
                    messages={messages}
                    isStreaming={isStreaming}
                    onSaveWord={openSaveWordModal}
                  />
                </div>

                {/* Input */}
                <CustomPromptPanel
                  onSubmit={sendMessage}
                  isDisabled={isStreaming}
                  placeholder="Reply to your tutor... (Enter to send, Shift+Enter for new line)"
                />
              </div>
            )}
          </div>

          {/* Sidebar: saved words */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-card-bg rounded-2xl border border-line-divider overflow-hidden">
              <button
                onClick={() => setShowSavedWords((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-btn-plain-hover transition-colors"
              >
                <span>📚 Saved Words ({savedWords.length})</span>
                <svg
                  className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${showSavedWords ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Always visible on desktop, toggleable on mobile */}
              <div className={`${showSavedWords ? "block" : "hidden"} lg:block p-4 pt-0`}>
                <SavedAIWords words={savedWords} onDelete={deleteSavedWord} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save word modal */}
      {wordToSave && (
        <SaveWordModal
          word={wordToSave.word}
          context={wordToSave.context}
          onConfirm={confirmSaveWord}
          onClose={closeSaveWordModal}
        />
      )}
    </div>
  );
}
