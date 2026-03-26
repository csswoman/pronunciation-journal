"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAIPractice } from "@/hooks/useAIPractice";
import TemplateGrid from "@/components/ai-practice/TemplateGrid";
import TemplateInputForm from "@/components/ai-practice/TemplateInputForm";
import ChatView from "@/components/ai-practice/ChatView";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import SaveWordModal from "@/components/ai-practice/SaveWordModal";
import { getUserStats } from "@/lib/db";
import type { UserStats, AISavedWord } from "@/lib/types";

const QUICK_PROMPTS = ["Roleplay as a barista", "Mock job interview", "Review my essay"];
const STREAK_BARS = [3, 5, 4, 7, 5, 6, 8];

function getMastery(difficulty: AISavedWord["difficulty"]) {
  switch (difficulty) {
    case "easy":   return { pct: 75, label: "Mastery: 75%", lvl: 3, critical: false };
    case "medium": return { pct: 40, label: "Mastery: 40%", lvl: 1, critical: false };
    case "hard":   return { pct: 0,  label: "Critical Review", lvl: null, critical: true };
  }
}

function WordSidebarCard({ word }: { word: AISavedWord }) {
  const m = getMastery(word.difficulty);
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5">{word.word}</p>
      {word.meaning && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-1.5">
          &ldquo;{word.meaning}&rdquo;
        </p>
      )}
      {m.critical ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-red-500">Critical Review</span>
          <span className="text-[10px] text-gray-400">Needs Practice</span>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">{m.label}</span>
            {m.lvl && <span className="text-[10px] text-gray-400">Lvl {m.lvl}</span>}
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
            <div className="h-1 bg-green-500 rounded-full" style={{ width: `${m.pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

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
    resetToSelect,
  } = useAIPractice();

  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    getUserStats().then(setStats);
  }, []);

  const worstWord = savedWords.find((w) => w.difficulty === "hard") ?? savedWords[0];
  const streak = stats?.currentStreak ?? 0;
  const nextMilestone = Math.ceil((streak + 1) / 5) * 5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left / main column ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Hero card */}
            <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 rounded-3xl p-8 text-white">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-4">
                AI Learning Hub
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
                Ready to master<br />your lexicon?
              </h1>
              <p className="text-purple-200 text-sm max-w-md leading-relaxed">
                Your AI assistant is ready to help you refine your grammar, expand your vocabulary, and chat naturally.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-400 border-2 border-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-purple-200">3 tools active today</span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── SELECT phase ── */}
            {phase === "select" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Practice Modes</h2>
                  <Link
                    href="/progress"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                  >
                    View Progress
                  </Link>
                </div>

                <TemplateGrid onSelect={selectTemplate} />

                {/* Custom AI Instruction */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Custom AI Instruction
                    </h3>
                  </div>
                  <CustomPromptPanel
                    onSubmit={(text) => {
                      submitTemplateVars({ templateId: "practice-questions", topic: text, userLevel: "intermediate" });
                    }}
                    isDisabled={isStreaming}
                    placeholder="Tell the AI what to do... (e.g. 'Explain the difference between Ser and Estar using travel examples')"
                  />
                  <div className="flex gap-2 mt-3 flex-wrap items-center">
                    <span className="text-xs text-gray-400">Try:</span>
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          submitTemplateVars({ templateId: "practice-questions", topic: p, userLevel: "intermediate" })
                        }
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── CONFIGURE phase ── */}
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

            {/* ── CHAT phase ── */}
            {phase === "chat" && (
              <div className="space-y-4">
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
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                  <ChatView messages={messages} isStreaming={isStreaming} onSaveWord={openSaveWordModal} />
                </div>
                <CustomPromptPanel
                  onSubmit={sendMessage}
                  isDisabled={isStreaming}
                  placeholder="Reply to your tutor... (Enter to send, Shift+Enter for new line)"
                />
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

            {/* Palabras Guardadas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-purple-500 rounded-sm" />
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Palabras Guardadas
                  </span>
                </div>
                <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  {savedWords.length} Total
                </span>
              </div>

              {savedWords.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  No saved words yet.<br />
                  Select any word in a response to save it.
                </p>
              ) : (
                <div>
                  {savedWords.slice(0, 4).map((w) => (
                    <WordSidebarCard key={w.id} word={w} />
                  ))}
                </div>
              )}

              <button className="w-full mt-3 py-2 border border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                Flashcard Session
              </button>
            </div>

            {/* Daily Streak */}
            <div className="bg-gray-900 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span className="text-sm font-medium">Daily Streak</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-4xl font-bold">{streak}</span>
                  <span className="text-gray-400 ml-2 text-sm">Days</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {STREAK_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="w-2 bg-green-400 rounded-sm"
                      style={{ height: `${(h / 8) * 40}px` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wider">
                Next milestone: {nextMilestone} days
              </p>
            </div>

            {/* Tutor's Tip */}
            {worstWord && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.298.057-.593.123-.88a7 7 0 10-8.245 0c.066.287.108.582.123.88h7.999z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    Tutor&apos;s Tip
                  </span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 italic leading-relaxed">
                  &ldquo;Try practicing &lsquo;{worstWord.word}&rsquo; in a sentence today to move it from your weak words to your mastered list.&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

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
