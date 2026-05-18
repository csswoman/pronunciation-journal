"use client";

import type { Tables } from "@/lib/supabase/types";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

type Entry = Tables<"entries">;

interface ManageAddTabProps {
  entries: Entry[];
  manualWord: string;
  manualPhrases: string;
  showPhrases: boolean;
  addingWord: boolean;
  onManualWordChange: (value: string) => void;
  onManualPhrasesChange: (value: string) => void;
  onTogglePhrases: () => void;
  onAddWord: () => void;
}

export function ManageAddTab(props: ManageAddTabProps) {
  const { entries, manualWord, manualPhrases, showPhrases, addingWord, onManualWordChange, onManualPhrasesChange, onTogglePhrases, onAddWord } = props;

  return <div className="p-4 space-y-4">
    <div>
      <label className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle block mb-1.5">Word</label>
      <input value={manualWord} onChange={(e) => onManualWordChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onAddWord()} placeholder="e.g. serendipity" autoFocus className="w-full px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
    </div>
    <div>
      <Button variant="ghost" size="sm" onClick={onTogglePhrases} icon={showPhrases ? <ChevronUp size={12} /> : <ChevronDown size={12} />} className="text-xs text-fg-subtle mb-2">{showPhrases ? "Hide phrases" : "Add phrases (optional)"}</Button>
      {showPhrases && <textarea value={manualPhrases} onChange={(e) => onManualPhrasesChange(e.target.value)} placeholder={"One phrase per line...\ne.g. a serendipitous encounter"} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none" />}
    </div>
    <Button variant="primary" fullWidth disabled={!manualWord.trim() || addingWord} icon={<Plus size={16} />} onClick={onAddWord}>{addingWord ? "Adding..." : "Add Word"}</Button>

    {entries.length > 0 && <div className="pt-2 border-t border-[var(--line-divider)]"><p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle mb-2">Recently added</p><div className="space-y-0.5">{entries.slice(-3).reverse().map((entry) => <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"><span className="text-sm text-fg font-medium">{entry.word}</span>{entry.ipa && <span className="text-xs text-fg-subtle">/{entry.ipa}/</span>}</div>)}</div></div>}
  </div>;
}
