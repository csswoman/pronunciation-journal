"use client";

import { Volume2, Check, Sparkles, BookOpen, NotebookPen } from "lucide-react";
import Button from "@/components/ui/Button";
import type { AISavedWord } from "@/lib/types";

interface AIVocabPanelProps {
  words: AISavedWord[];
  onDelete: (id: number) => void;
  onGeneratePractice: () => void;
  onGenerateWithWords: () => void;
}

export default function AIVocabPanel({
  words,
  onDelete,
  onGeneratePractice,
  onGenerateWithWords,
}: AIVocabPanelProps) {
  return (
    <aside
      className="hidden lg:flex flex-col w-56 flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: "var(--card-bg)" }}
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
    </aside>
  );
}

function VocabHeader({ count }: { count: number }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <BookOpen size={12} style={{ color: "var(--text-tertiary)" }} />
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-tertiary)" }}
      >
        Vocab · {count} {count === 1 ? "word" : "words"}
      </p>
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

function VocabItem({ word, onDelete }: { word: AISavedWord; onDelete: (id: number) => void }) {
  const speakWord = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(word.word);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      className="group flex items-start justify-between p-2.5 rounded-xl border transition-colors"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--line-divider)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line-divider)")}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {word.word}
        </p>
        {word.meaning && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
            {word.meaning}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={speakWord}
          aria-label="Speak word"
          className="w-6 h-6 rounded-full border"
          style={{ borderColor: "var(--line-divider)" } as React.CSSProperties}
        >
          <Volume2 size={11} />
        </Button>

        <div
          className="w-6 h-6 flex items-center justify-center rounded-full border"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
        >
          <Check size={11} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function VocabActions({
  hasWords,
  onGeneratePractice,
  onGenerateWithWords,
}: {
  hasWords: boolean;
  onGeneratePractice: () => void;
  onGenerateWithWords: () => void;
}) {
  return (
    <div
      className="p-3 space-y-2 flex-shrink-0 border-t"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      <Button
        onClick={onGeneratePractice}
        variant="primary"
        size="sm"
        fullWidth
        icon={<Sparkles size={13} />}
      >
        Generate practice
      </Button>
      <Button
        onClick={onGenerateWithWords}
        disabled={!hasWords}
        variant="secondary"
        size="sm"
        fullWidth
        icon={<BookOpen size={13} />}
      >
        With my words
      </Button>
    </div>
  );
}
