"use client";
import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
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

interface EditDeckModalProps {
  deck: Deck;
  onClose: () => void;
  onUpdated: (deck: Deck) => void;
  onDelete: () => void;
}

export function EditDeckModal({ deck, onClose, onUpdated, onDelete }: EditDeckModalProps) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? "");
  const [color, setColor] = useState(deck.color ?? COLORS[0]);
  const [icon, setIcon] = useState(deck.icon ?? ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    const { data, error: err } = await supabase
      .from("decks")
      .update({ name: name.trim(), description: description.trim() || null, color, icon, updated_at: new Date().toISOString() })
      .eq("id", deck.id)
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-[var(--deep-text)]">Edit Deck</h2>
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
            <p className="font-semibold text-sm text-[var(--deep-text)] truncate">{name || "Deck name"}</p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{description || "Description"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Icon</label>
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
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Color</label>
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

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
