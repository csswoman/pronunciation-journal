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
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'}}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl" style={{background: 'rgba(255,255,255,0.2)'}}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl" style={{background: 'rgba(255,255,255,0.2)'}}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between mb-8">
            <Link
              href="/"
              className="p-2 rounded-lg transition-colors hover:bg-white/20"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              AI LEARNING HUB
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to practice with AI?
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Your personal tutor is here to help you refine your grammar, expand your vocabulary, and chat naturally.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: `hsl(${200 + i * 40}, 70%, 50%)`,
                        border: '2px solid white'
                      }}
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-white/80">3 tools active today</span>
              </div>
            </div>
            
            <div className="relative hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
                  <div className="h-3 bg-white/20 rounded-full w-full"></div>
                  <div className="h-3 bg-white/20 rounded-full w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Stats Section */}
        {phase === "select" && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl p-6" style={{background: 'var(--card-bg)', border: '1px solid var(--line-divider)'}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{savedWords.length}</span>
                  <span className="text-2xl">📚</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Saved Words</p>
              </div>
              
              <div className="rounded-xl p-6" style={{background: 'var(--card-bg)', border: '1px solid var(--line-divider)'}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold" style={{color: 'var(--primary)'}}>3</span>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Practice Tools</p>
              </div>
              
              <div className="rounded-xl p-6" style={{background: 'var(--card-bg)', border: '1px solid var(--line-divider)'}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold" style={{color: 'var(--admonitions-color-tip)'}}>Today</span>
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Session Status</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Error banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl text-sm flex items-start gap-3 border-l-4" style={{
                backgroundColor: 'var(--btn-regular-bg)',
                borderColor: 'var(--admonitions-color-caution)',
                color: 'var(--admonitions-color-caution)',
              }}>
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Phase: select */}
            {phase === "select" && (
              <div className="space-y-12">
                {/* Practice Modes */}
                <section>
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                      Practice Modes
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                      Choose how you want to learn today
                    </p>
                  </div>
                  <TemplateGrid onSelect={selectTemplate} />
                </section>

                {/* Custom prompt section */}
                <section>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6" style={{color: 'var(--primary)'}} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                      </svg>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        Custom AI Instruction
                      </h3>
                    </div>
                    <p className="text-[var(--text-secondary)] ml-8">
                      Tell the AI what you'd like to practice. It adapts to your needs.
                    </p>
                  </div>
                  <CustomPromptPanel
                    onSubmit={(text) => {
                      submitTemplateVars({ templateId: "practice-questions", topic: text, userLevel: "intermediate" });
                    }}
                    isDisabled={isStreaming}
                    placeholder="e.g. Explain the difference between 'since' and 'for' using travel examples"
                  />
                </section>
              </div>
            )}

            {/* Phase: configure */}
            {phase === "configure" && selectedTemplate && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={resetToSelect}
                    className="p-2 rounded-lg transition-colors hover:bg-btn-plain-hover"
                    aria-label="Go back"
                  >
                    <svg className="w-5 h-5" style={{color: 'var(--primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Set up your session</h2>
                </div>
                <div className="bg-card-bg rounded-2xl border border-line-divider p-8">
                  <TemplateInputForm
                    templateId={selectedTemplate as import("@/lib/types").AITemplateId}
                    onSubmit={submitTemplateVars}
                    onBack={resetToSelect}
                    isLoading={isStreaming}
                  />
                </div>
              </div>
            )}

            {/* Phase: chat */}
            {phase === "chat" && (
              <div className="space-y-6">
                {/* Back + new session button */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={resetToSelect}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      color: 'var(--primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-plain-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Select
                  </button>
                  <span className="text-xs text-[var(--text-tertiary)] bg-btn-regular px-3 py-1 rounded-full">
                    💡 Select any word to save it
                  </span>
                </div>

                {/* Chat Messages */}
                <div className="rounded-2xl border border-line-divider overflow-hidden" style={{background: 'var(--card-bg)'}}>
                  <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-6">
                    <ChatView
                      messages={messages}
                      isStreaming={isStreaming}
                      onSaveWord={openSaveWordModal}
                    />
                  </div>
                </div>

                {/* Input */}
                <div className="sticky bottom-0">
                  <CustomPromptPanel
                    onSubmit={sendMessage}
                    isDisabled={isStreaming}
                    placeholder="Reply to your tutor... (Enter to send, Shift+Enter for new line)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: saved words */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-20 rounded-2xl border border-line-divider overflow-hidden" style={{background: 'var(--card-bg)'}}>
              {/* Header */}
              <button
                onClick={() => setShowSavedWords((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 font-semibold text-[var(--text-primary)] hover:bg-btn-plain-hover transition-colors border-b border-line-divider"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  <span>Saved Words</span>
                  <span className="ml-1 px-2.5 py-0.5 text-xs font-bold rounded-full" style={{
                    background: 'var(--primary)',
                    color: 'white'
                  }}>
                    {savedWords.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--text-tertiary)] transition-transform ${showSavedWords ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Content */}
              <div className={`${showSavedWords ? "block" : "hidden"} lg:block`}>
                {savedWords.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Words you save during practice will appear here
                    </p>
                  </div>
                ) : (
                  <div className="p-4">
                    <SavedAIWords words={savedWords} onDelete={deleteSavedWord} />
                  </div>
                )}
              </div>
            </div>

            {/* Tutor's Tip */}
            <div className="mt-6 rounded-2xl border border-line-divider p-6" style={{background: 'var(--card-bg)'}}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">Tutor's Tip</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    "Try practicing 'ineffable' in a sentence today to move it from your weak words to your mastered list."
                  </p>
                </div>
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
