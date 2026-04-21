"use client";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";

type Entry = Tables<"entries">;

interface EditEntryModalProps {
  entry: Entry;
  phrases: string;
  onPhrasesChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditEntryModal({ entry, phrases, onPhrasesChange, onSave, onCancel }: EditEntryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-[var(--deep-text)] mb-4">
          Edit phrases for "{entry.word}"
        </h3>
        <textarea
          value={phrases}
          onChange={e => onPhrasesChange(e.target.value)}
          placeholder="Enter phrases, one per line…"
          rows={4}
          className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
