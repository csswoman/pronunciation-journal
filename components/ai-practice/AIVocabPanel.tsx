"use client";

import { Volume2, Check, Sparkles, BookOpen, NotebookPen, ShieldCheck } from "lucide-react";
import type { AISavedWord } from "@/lib/types";

interface AIVocabPanelProps {
  words: AISavedWord[];
  onDelete: (id: number) => void;
  onGeneratePractice: () => void;
  onGenerateWithWords: () => void;
  collapsed?: boolean;
}

export default function AIVocabPanel({
  words,
  onDelete,
  onGeneratePractice,
  onGenerateWithWords,
  collapsed = false,
}: AIVocabPanelProps) {
  return (
    <aside
      className={`flex-col w-56 flex-shrink-0 overflow-hidden border-l transition-all duration-200 ${collapsed ? "hidden" : "hidden lg:flex"}`}
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--card-bg)" }}
    >
      <VocabHeader count={words.length} />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {words.length === 0 ? (
          <VocabEmpty />
        ) : (
          words.map((w) => <VocabItem key={w.id} word={w} onDelete={onDelete} />)
        )}
      </div>

      <VocabActions
        hasWords={words.length > 0}
        onGeneratePractice={onGeneratePractice}
        onGenerateWithWords={onGenerateWithWords}
      />
      <AutoSaveInfo />
    </aside>
  );
}

function VocabHeader({ count }: { count: number }) {
  return (
    <div
      className="flex-shrink-0 border-b"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <BookOpen size={12} style={{ color: "var(--text-tertiary)" }} />
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          Vocab · {count} {count === 1 ? "word" : "words"}
        </p>
      </div>

      <div className="px-4 pb-3">
        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Words collected</p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Words you&apos;ve saved</p>
        <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{count}</p>
      </div>
    </div>
  );
}

function VocabEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 pt-8 px-2 text-center">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <NotebookPen size={18} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
        Select words from the chat to save them here.
      </p>
    </div>
  );
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function getCEFRLevel(word: string): string {
  const hash = word.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return CEFR_LEVELS[hash % CEFR_LEVELS.length];
}

function VocabItem({ word }: { word: AISavedWord; onDelete: (id: number) => void }) {
  const cefrLevel = getCEFRLevel(word.word);
  const speakWord = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(word.word);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      className="group flex items-center justify-between px-2.5 py-2 rounded-xl border transition-colors"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-divider)")}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <BookOpen size={12} className="flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {word.word}
          </p>
          {word.meaning && (
            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
              {word.meaning}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
        <span className="text-[10px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
          {cefrLevel}
        </span>
        <button onClick={speakWord} aria-label="Speak word" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Volume2 size={12} style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>
    </div>
  );
}

function VocabActions({
  hasWords,
  onGenerateWithWords,
}: {
  hasWords: boolean;
  onGeneratePractice: () => void;
  onGenerateWithWords: () => void;
}) {
  return (
    <div className="px-3 pb-2 flex-shrink-0 space-y-2">
      <button
        onClick={onGenerateWithWords}
        disabled={!hasWords}
        className="w-full p-3 rounded-xl text-left transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <p className="text-sm font-semibold">Practice with your words</p>
        <p className="text-xs mt-0.5 opacity-80">Use your saved words in a custom practice session.</p>
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold">
          Practice now
          <Sparkles size={11} />
        </div>
      </button>
    </div>
  );
}

function AutoSaveInfo() {
  return (
    <div
      className="px-3 pb-3 flex-shrink-0"
    >
      <div
        className="flex items-start gap-2 px-3 py-2 rounded-xl border"
        style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
      >
        <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Auto-save</p>
          <p className="text-[10px] leading-snug mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            New words from the chat are saved automatically.
          </p>
        </div>
        <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
      </div>
    </div>
  );
}
