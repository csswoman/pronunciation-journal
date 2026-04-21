"use client";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";

interface AddWordFormProps {
  word: string;
  phrases: string;
  adding: boolean;
  onWordChange: (v: string) => void;
  onPhrasesChange: (v: string) => void;
  onSubmit: () => void;
}

export function AddWordForm({ word, phrases, adding, onWordChange, onPhrasesChange, onSubmit }: AddWordFormProps) {
  return (
    <div className="space-y-2">
      <input
        value={word}
        onChange={e => onWordChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSubmit()}
        placeholder="Add word…"
        className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
      />
      <textarea
        value={phrases}
        onChange={e => onPhrasesChange(e.target.value)}
        placeholder="Add phrases (one per line, optional)…"
        rows={2}
        className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
      />
      <Button
        onClick={onSubmit}
        disabled={!word.trim() || adding}
        className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={16} />
        Add
      </Button>
    </div>
  );
}
