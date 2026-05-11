"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

const ICONS = [
  "📚", "✏️", "🌍", "💼", "🎯", "🔬", "🎨", "🏋️",
  "🍕", "✈️", "🎵", "💡", "🧠", "📰", "🤝", "🏠",
];

interface CreateDeckFromWordsModalProps {
  wordIds: string[];
  onClose: () => void;
  onCreated: (deck: Deck) => void;
}

export function CreateDeckFromWordsModal({ wordIds, onClose, onCreated }: CreateDeckFromWordsModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowserClient();

    const { data: deck, error: deckErr } = await supabase
      .from("decks")
      .insert({ name: name.trim(), description: description.trim() || null, color, icon, user_id: user.id })
      .select()
      .single();

    if (deckErr || !deck) {
      setError(deckErr?.message ?? "Failed to create deck");
      setSaving(false);
      return;
    }

    const links = wordIds.map(word_id => ({ word_id, deck_id: deck.id }));
    const { error: linkErr } = await supabase.from("word_bank_decks").insert(links);
    setSaving(false);

    if (linkErr) {
      setError(linkErr.message);
      return;
    }

    onCreated(deck);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <H2 className="font-heading font-bold text-lg">New deck from selection</H2>
            <p className="text-xs text-fg-subtle mt-0.5">{wordIds.length} word{wordIds.length !== 1 ? "s" : ""} will be added</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--btn-regular-bg)]">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: color }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-fg truncate">{name || "Deck name"}</p>
            <p className="text-xs text-fg-subtle truncate">{description || "Description"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && void handleCreate()}
              placeholder="e.g. Travel Vocabulary"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this deck about?"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-2 block">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === i
                      ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 scale-110"
                      : "bg-[var(--btn-regular-bg)] hover:scale-105"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--primary)] scale-110" : "hover:scale-105"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" fullWidth onClick={() => void handleCreate()} disabled={!name.trim() || saving}>
            {saving ? "Creating…" : "Create & add words"}
          </Button>
        </div>
      </div>
    </div>
  );
}
