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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="text-purple-200 hover:text-white transition-colors"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">AI Practice</h1>
          </div>
          <p className="text-purple-200 text-sm">
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
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ✍️ Custom Prompt
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
                    className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    New session
                  </button>
                  <span className="text-xs text-gray-400">
                    Select any word in a response to save it
                  </span>
                </div>

                {/* Chat messages */}
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setShowSavedWords((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span>📚 Saved Words ({savedWords.length})</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showSavedWords ? "rotate-180" : ""}`}
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
