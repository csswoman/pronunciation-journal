"use client";

import { Plus } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { DeckGrid } from "@/components/vocabulary/decks/DeckGrid";
import type { DeckCounts } from "@/hooks/useDeckData";

interface DecksTabProps {
  decks: any[];
  counts: DeckCounts;
  loading: boolean;
  onStudy: (id: string) => void;
  onManage: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export function DecksTab({
  decks,
  counts,
  loading,
  onStudy,
  onManage,
  onEdit,
  onDelete,
  onCreateNew,
}: DecksTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-52 rounded-2xl animate-pulse bg-surface-sunken">
            <div />
          </Card>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-surface-sunken">
            📚
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">No decks yet</p>
            <p className="text-xs mt-1 text-fg-subtle">Create your first deck to organize vocabulary by theme.</p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onCreateNew} className="mt-2">
            Create a deck
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <DeckGrid
        decks={decks}
        counts={counts}
        onStudy={onStudy}
        onManage={onManage}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateNew={onCreateNew}
      />
    </>
  );
}
