"use client";

import type { Tables } from "@/lib/supabase/types";
import { BookOpen, CheckSquare, Minus, Search, Square, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { EntryRow } from "./EntryRow";

type Entry = Tables<"entries">;

interface ManageVocabTabProps {
  loading: boolean;
  entries: Entry[];
  filter: string;
  selected: Set<string>;
  selectMode: boolean;
  onFilterChange: (value: string) => void;
  onToggleSelectAll: () => void;
  onBulkRemove: () => void;
  onToggleSelect: (id: string) => void;
  onRemoveWord: (id: string) => void;
  onSaveEntry: (id: string, phrases: string[], meaning: string) => Promise<void>;
  onChangeTab: (tab: "add" | "ai") => void;
}

export function ManageVocabTab(props: ManageVocabTabProps) {
  const { loading, entries, filter, selected, selectMode, onFilterChange, onToggleSelectAll, onBulkRemove, onToggleSelect, onRemoveWord, onSaveEntry, onChangeTab } = props;
  const filtered = entries.filter((e) => e.word.toLowerCase().includes(filter.toLowerCase()));
  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  return <div className="p-4 space-y-3">
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
      <input value={filter} onChange={(e) => onFilterChange(e.target.value)} placeholder="Search words..." className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
    </div>

    {filtered.length > 0 && !loading && <div className="flex items-center gap-2">
      <button onClick={onToggleSelectAll} className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors">
        {allFilteredSelected ? <CheckSquare size={14} className="text-[var(--primary)]" /> : selected.size > 0 ? <Minus size={14} className="text-fg-subtle" /> : <Square size={14} />}
        {allFilteredSelected ? "Deselect all" : "Select all"}
      </button>
      {selected.size > 0 && <button onClick={onBulkRemove} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-warning bg-warning-soft hover:bg-warning-soft transition-colors"><Trash2 size={12} />Remove {selected.size}</button>}
    </div>}

    {loading ? <div className="space-y-2 pt-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-[var(--btn-regular-bg)] animate-pulse" />)}</div>
      : filtered.length === 0 && entries.length === 0 ? <div className="flex flex-col items-center justify-center py-16 gap-3 text-center"><div className="w-12 h-12 rounded-full bg-[var(--btn-regular-bg)] flex items-center justify-center"><BookOpen size={20} className="text-fg-subtle" /></div><div><p className="text-sm font-medium text-fg">No words yet</p><p className="text-xs text-fg-subtle mt-1">Add words manually or use AI suggestions</p></div><div className="flex gap-2"><Button variant="primary" size="sm" onClick={() => onChangeTab("add")}>Add word</Button><Button variant="outline" size="sm" onClick={() => onChangeTab("ai")}>AI Suggest</Button></div></div>
      : filtered.length === 0 ? <p className="text-center text-xs text-fg-subtle py-8">No matching words</p>
        : <div className="space-y-1">{filtered.map((entry) => <EntryRow key={entry.id} entry={entry} selected={selected.has(entry.id)} onToggleSelect={onToggleSelect} onRemove={onRemoveWord} onSaveEntry={onSaveEntry} selectMode={selectMode} />)}</div>}
  </div>;
}
