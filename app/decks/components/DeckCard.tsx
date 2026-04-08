"use client";

import { Settings2, Play, Trash2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

interface DeckCardProps {
  deck: Deck;
  entryCount: number;
  onStudy: () => void;
  onManage: () => void;
  onDelete: () => void;
}

export function DeckCard({ deck, entryCount, onStudy, onManage, onDelete }: DeckCardProps) {
  const canStudy = entryCount > 0;

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] overflow-hidden transition-all hover:shadow-md">
      {/* Color bar */}
      <div className="h-1.5" style={{ background: deck.color ?? "var(--primary)" }} />

      <div className="p-4 space-y-2">
        {/* Title row with manage button */}
        <div className="flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
              style={{ background: deck.color ?? "var(--primary)" }}
            >
              {deck.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--deep-text)] truncate">{deck.name}</p>
              {deck.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{deck.description}</p>
              )}
            </div>
          </div>

          {/* Manage button */}
          <button
            onClick={onManage}
            title="Edit deck"
            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors flex-shrink-0"
          >
            <Settings2 size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className="px-1 text-xs text-[var(--text-tertiary)] font-medium">
          {entryCount} word{entryCount !== 1 ? "s" : ""} • 0 due • —
        </div>

        {/* Study button */}
        <button
          onClick={onStudy}
          disabled={!canStudy}
          title={!canStudy ? "Add words to study" : ""}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            canStudy
              ? "bg-[var(--primary)] text-white hover:opacity-90"
              : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
          }`}
        >
          <Play size={16} className="fill-current" />
          Study
        </button>

        {/* Delete button (compact, hidden by default) */}
        <button
          onClick={onDelete}
          title="Delete deck"
          className="w-full py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} className="inline mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}
