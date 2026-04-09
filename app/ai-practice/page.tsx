"use client";

import { useState } from "react";
import Image from "next/image";
import { useAIPractice } from "@/hooks/useAIPractice";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import Grid from "@/components/layout/Grid";
import Card from "@/components/layout/Card";
import PageHeader from "@/components/layout/PageHeader";
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
      {/* Replace hero banner with PageHeader */}
      <div style={{background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'}}>
        <Container>
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
        </Container>
      </div>

      <main className="py-12">
        {/* Stats Section */}
        {phase === "select" && (
          <Container>
            <Section spacing="lg" className="mb-12">
              <Grid cols="3" gap="md" responsive={true}>
                <Card variant="stat">
                  <span className="text-2xl">📚</span>
                  <div>
                    <span className="text-2xl font-bold text-[var(--text-primary)]">{savedWords.length}</span>
                    <p className="text-sm text-[var(--text-secondary)]">Saved Words</p>
                  </div>
                </Card>

                <Card variant="stat">
                  <span className="text-2xl">✨</span>
                  <div>
                    <span className="text-2xl font-bold" style={{color: 'var(--primary)'}}>3</span>
                    <p className="text-sm text-[var(--text-secondary)]">Practice Tools</p>
                  </div>
                </Card>

                <Card variant="stat">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <span className="text-2xl font-bold" style={{color: 'var(--admonitions-color-tip)'}}>Today</span>
                    <p className="text-sm text-[var(--text-secondary)]">Session Status</p>
                  </div>
                </Card>
              </Grid>
            </Section>
          </Container>
        )}

        <Container>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Error banner */}
              {error && (
                <Card className="mb-6 p-4 text-sm flex items-start gap-3 border-l-4" style={{
                  backgroundColor: 'var(--btn-regular-bg)',
                  borderColor: 'var(--admonitions-color-caution)',
                  color: 'var(--admonitions-color-caution)',
                  borderLeftWidth: '4px',
                }}>
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </Card>
              )}

              {/* Phase: select */}
              {phase === "select" && (
                <div className="space-y-12">
                {/* Practice Modes */}
                <Section spacing="lg" title="Practice Modes" description="Choose how you want to learn today">
                  <TemplateGrid onSelect={selectTemplate} />
                </Section>

                {/* Custom prompt section */}
                <Section spacing="lg">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6" style={{color: 'var(--primary)'}} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                      Custom AI Instruction
                    </h3>
                  </div>
                  <p className="text-base text-[var(--text-secondary)] mb-6">
                    Tell the AI what you'd like to practice. It adapts to your needs.
                  </p>
                  <CustomPromptPanel
                    onSubmit={(text) => {
                      submitTemplateVars({ templateId: "practice-questions", topic: text, userLevel: "intermediate" });
                    }}
                    isDisabled={isStreaming}
                    placeholder="e.g. Explain the difference between 'since' and 'for' using travel examples"
                  />
                </Section>
              </div>
            )}

            {/* Phase: configure */}
            {phase === "configure" && selectedTemplate && (
              <Section spacing="lg">
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
                <Card className="p-8">
                  <TemplateInputForm
                    templateId={selectedTemplate as import("@/lib/types").AITemplateId}
                    onSubmit={submitTemplateVars}
                    onBack={resetToSelect}
                    isLoading={isStreaming}
                  />
                </Card>
              </Section>
            )}

            {/* Phase: chat */}
            {phase === "chat" && (
              <Section spacing="lg">
                {/* Back + new session button */}
                <div className="flex items-center justify-between gap-4 mb-6">
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
                <Card className="min-h-[400px] max-h-[600px] overflow-y-auto p-6" style={{maxWidth: '100%'}}>
                  <ChatView
                    messages={messages}
                    isStreaming={isStreaming}
                    onSaveWord={openSaveWordModal}
                  />
                </Card>

                {/* Input */}
                <div className="sticky bottom-0 mt-6">
                  <CustomPromptPanel
                    onSubmit={sendMessage}
                    isDisabled={isStreaming}
                    placeholder="Reply to your tutor... (Enter to send, Shift+Enter for new line)"
                  />
                </div>
              </Section>
            )}
            </div>

            {/* Sidebar: saved words */}
            <div className="lg:w-72 flex-shrink-0">
              <Card className="sticky top-20 p-0 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setShowSavedWords((v) => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 font-semibold text-[var(--text-primary)] hover:bg-btn-plain-hover transition-colors border-b border-[var(--line-divider)]"
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
              </Card>

              {/* Tutor's Tip */}
              <Card className="mt-6 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">Tutor's Tip</h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      "Try practicing 'ineffable' in a sentence today to move it from your weak words to your mastered list."
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
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
