"use client";

import { Plus } from "@/components/icons";
import { DeckCard } from "./DeckCard";
import type { DeckCounts } from "@/hooks/useDeckData";
import type { DeckListItem } from "@/lib/decks/queries";

interface DeckGridProps {
  decks: DeckListItem[];
  counts: DeckCounts;
  onStudy: (id: string) => void;
  onManage: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  onStudyHover?: () => void;
  onManageHover?: () => void;
  onEditHover?: () => void;
  onCreateNewHover?: () => void;
}

export function DeckGrid({
  decks,
  counts,
  onStudy,
  onManage,
  onEdit,
  onDelete,
  onCreateNew,
  onStudyHover,
  onManageHover,
  onEditHover,
  onCreateNewHover,
}: DeckGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grid-flow-row-dense">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          entryCount={counts.words[deck.id] ?? 0}
          dueCount={counts.due[deck.id] ?? 0}
          masteredCount={counts.mastered[deck.id] ?? 0}
          onStudy={() => onStudy(deck.id)}
          onStudyHover={onStudyHover}
          onManage={() => onManage(deck.id)}
          onManageHover={onManageHover}
          onEdit={() => onEdit(deck.id)}
          onEditHover={onEditHover}
          onDelete={() => onDelete(deck.id)}
        />
      ))}

      <button
        type="button"
        onClick={onCreateNew}
        onMouseEnter={onCreateNewHover}
        onFocus={onCreateNewHover}
        className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border-default bg-surface-sunken/50 p-5 text-center transition-all hover:border-border-strong hover:bg-surface-raised min-h-[150px] focus-ring select-none"
      >
        <div className="flex size-11 items-center justify-center rounded-2xl border border-border-subtle bg-surface-raised text-fg group-hover:scale-105 transition-transform shadow-xs">
          <Plus size={20} className="text-fg-muted group-hover:text-primary transition-colors" />
        </div>
        <span className="font-heading text-body-sm font-bold text-fg group-hover:text-primary transition-colors">
          Nuevo mazo
        </span>
      </button>
    </div>
  );
}
