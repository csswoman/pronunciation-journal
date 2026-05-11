"use client";
import { Plus } from "lucide-react";
import { DeckCard } from "./DeckCard";
import type { Tables } from "@/lib/supabase/types";
import type { DeckCounts } from "@/hooks/useDeckData";

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
        className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-[color-mix(in_oklch,var(--primary)_30%,var(--line-divider))] bg-[var(--card-bg)] px-4 py-3 text-center transition-all hover:border-[var(--primary)] hover:bg-[color-mix(in_oklch,var(--primary)_5%,var(--card-bg))] group"
      >
        <div className="w-10 h-10 rounded-full border border-[var(--line-divider)] bg-[var(--surface-sunken)] flex items-center justify-center">
          <Plus size={16} className="text-fg-subtle" />
        </div>
        <div>
          <p className="font-semibold text-[14px] text-fg">New deck</p>
        </div>
      </button>
    </div>
  );
}
