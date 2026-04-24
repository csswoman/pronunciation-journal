"use client";
import { Plus } from "lucide-react";
import { DeckCard } from "./DeckCard";
import type { Tables } from "@/lib/supabase/types";
import type { DeckCounts } from "../hooks/useDeckData";

type Deck = Tables<"decks">;

interface DeckGridProps {
  decks: Deck[];
  counts: DeckCounts;
  onStudy: (id: string) => void;
  onManage: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export function DeckGrid({ decks, counts, onStudy, onManage, onEdit, onDelete, onCreateNew }: DeckGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          entryCount={counts.words[deck.id] ?? 0}
          dueCount={counts.due[deck.id] ?? 0}
          masteredCount={counts.mastered[deck.id] ?? 0}
          onStudy={() => onStudy(deck.id)}
          onManage={() => onManage(deck.id)}
          onEdit={() => onEdit(deck.id)}
          onDelete={() => onDelete(deck.id)}
        />
      ))}

      <button
        onClick={onCreateNew}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[var(--line-divider)] bg-[var(--card-bg)] p-8 text-center transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--btn-regular-bg)] group min-h-[220px]"
      >
        <div className="relative">
          <div className="w-16 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="14" width="44" height="36" rx="4" fill="var(--text-tertiary)" opacity="0.4" />
              <rect x="4" y="10" width="44" height="36" rx="4" fill="var(--text-tertiary)" opacity="0.6" />
              <rect x="0" y="6" width="44" height="36" rx="4" fill="var(--text-secondary)" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <Plus size={14} className="text-white" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--deep-text)]">Create your next deck</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Collect new words and start learning.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/15 transition-colors">
          <Plus size={14} />
          New Deck
        </span>
      </button>
    </div>
  );
}
