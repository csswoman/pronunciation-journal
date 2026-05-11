"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

interface AddToExistingDeckModalProps {
  wordIds: string[];
  decks: Deck[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddToExistingDeckModal({ wordIds, decks, onClose, onAdded }: AddToExistingDeckModalProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!selectedDeckId) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    const links = wordIds.map(word_id => ({ word_id, deck_id: selectedDeckId }));
    // upsert ignores conflicts (word already in deck)
    const { error: err } = await supabase.from("word_bank_decks").upsert(links, { ignoreDuplicates: true });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <H2 className="font-heading font-bold text-lg">Add to deck</H2>
            <p className="text-xs text-fg-subtle mt-0.5">{wordIds.length} word{wordIds.length !== 1 ? "s" : ""} selected</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {decks.length === 0 ? (
          <p className="text-sm text-fg-subtle text-center py-4">No decks yet. Create one first.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {decks.map(deck => (
              <button
                key={deck.id}
                type="button"
                onClick={() => setSelectedDeckId(deck.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                style={{
                  borderColor: selectedDeckId === deck.id ? "var(--primary)" : "var(--line-divider)",
                  background: selectedDeckId === deck.id ? "color-mix(in oklch, var(--primary) 8%, var(--card-bg))" : "var(--btn-regular-bg)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: deck.color ?? "#6366f1" }}
                >
                  {deck.icon ?? "📚"}
                </div>
                <span className="text-sm font-medium text-fg flex-1 truncate">{deck.name}</span>
                {selectedDeckId === deck.id && (
                  <Check size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => void handleAdd()}
            disabled={!selectedDeckId || saving || decks.length === 0}
          >
            {saving ? "Adding…" : "Add to deck"}
          </Button>
        </div>
      </div>
    </div>
  );
}
