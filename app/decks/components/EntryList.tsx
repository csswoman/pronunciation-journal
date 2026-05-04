"use client";
import { Settings2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";

type Entry = Tables<"entries">;

interface EntryListProps {
  entries: Entry[];
  loading: boolean;
  filter: string;
  onFilterChange: (value: string) => void;
  onEdit: (entry: Entry) => void;
  onRemove: (entryId: string) => void;
}

function EntryRow({ entry, onEdit, onRemove }: { entry: Entry; onEdit: (e: Entry) => void; onRemove: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] group transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--deep-text)] truncate">{entry.word}</p>
        {entry.ipa && <p className="text-xs text-[var(--text-tertiary)]">/{entry.ipa}/</p>}
        {entry.phrases && entry.phrases.length > 0 && (
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {entry.phrases[0]}{entry.phrases.length > 1 ? ` (+${entry.phrases.length - 1})` : ""}
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} title="Edit phrases">
          <Settings2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(entry.id)}>
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}

export function EntryList({ entries, loading, filter, onFilterChange, onEdit, onRemove }: EntryListProps) {
  const filtered = entries.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <input
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
        placeholder="Filter words…"
        className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 mb-3"
      />

      <p className="text-tiny font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
        Words ({loading ? "…" : filtered.length})
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-[var(--btn-regular-bg)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 && entries.length === 0 ? (
        <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
          <p>No words yet</p>
          <p className="mt-1">Add words manually or use AI suggestions</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-4 text-xs text-[var(--text-tertiary)]">No matching words</div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => (
            <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
