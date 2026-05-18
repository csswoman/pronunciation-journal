"use client";

import { useState } from "react";
import type { Tables } from "@/lib/supabase/types";
import { Check, CheckSquare, ChevronUp, Pencil, Square, Trash2, Volume2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { speakWord } from "@/lib/word-bank/speech";

type Entry = Tables<"entries">;

interface EntryRowProps {
  entry: Entry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSaveEntry: (id: string, phrases: string[], meaning: string) => Promise<void>;
  selectMode: boolean;
}

export function EntryRow({ entry, selected, onToggleSelect, onRemove, onSaveEntry, selectMode }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingPhrases, setEditingPhrases] = useState("");
  const [editingMeaning, setEditingMeaning] = useState("");
  const [saving, setSaving] = useState(false);

  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  const firstMeaning = meanings[0] as { partOfSpeech?: string; definitions?: { definition?: string }[] } | undefined;
  const pos = firstMeaning?.partOfSpeech;
  const currentDefinition = firstMeaning?.definitions?.[0]?.definition ?? "";

  const openEdit = () => {
    setEditingPhrases(entry.phrases ? entry.phrases.join("\n") : "");
    setEditingMeaning(currentDefinition);
    setExpanded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const phrases = editingPhrases.trim() ? editingPhrases.split("\n").map((p) => p.trim()).filter(Boolean) : [];
    await onSaveEntry(entry.id, phrases, editingMeaning.trim());
    setSaving(false);
    setExpanded(false);
  };

  return (
    <div className={`rounded-xl border transition-colors ${selected ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-transparent hover:border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)]"}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => onToggleSelect(entry.id)} className={`flex-shrink-0 transition-opacity ${selectMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {selected ? <CheckSquare size={16} className="text-[var(--primary)]" /> : <Square size={16} className="text-fg-subtle" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-fg">{entry.word}</span>
            {pos && <span className="text-tiny px-1.5 py-0.5 rounded-full border border-[var(--line-divider)] text-fg-subtle font-medium">{pos}</span>}
          </div>
          {entry.ipa && <p className="text-xs text-fg-subtle mt-0.5">/{entry.ipa}/</p>}
          {!expanded && currentDefinition && <p className="text-xs text-fg-muted truncate mt-0.5">{currentDefinition}</p>}
          {!expanded && entry.phrases && entry.phrases.length > 0 && <p className="text-xs text-fg-muted truncate mt-0.5 italic">"{entry.phrases[0]}"{entry.phrases.length > 1 ? ` +${entry.phrases.length - 1}` : ""}</p>}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => speakWord(entry.word)} className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-[var(--btn-regular-bg)] transition-colors" title="Pronounce">
            <Volume2 size={13} />
          </button>
          <button onClick={expanded ? () => setExpanded(false) : openEdit} className={`p-1.5 rounded-lg transition-colors ${expanded ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-fg-subtle hover:text-fg hover:bg-[var(--btn-regular-bg)]"}`} title="Edit phrases">
            {expanded ? <ChevronUp size={13} /> : <Pencil size={13} />}
          </button>
          <button onClick={() => onRemove(entry.id)} className="p-1.5 rounded-lg text-fg-subtle hover:text-error hover:bg-error-soft transition-colors" title="Remove">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[var(--line-divider)] pt-3 mx-1">
          <div>
            <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle mb-1.5">Meaning / definition</p>
            <textarea autoFocus value={editingMeaning} onChange={(e) => setEditingMeaning(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none" />
          </div>
          <div>
            <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle mb-1.5">Phrases / examples</p>
            <textarea value={editingPhrases} onChange={(e) => setEditingPhrases(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} icon={saving ? undefined : <Check size={12} />}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
