"use client";

import { Plus, BookOpen } from "@/components/icons";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { DeckGrid } from "@/components/vocabulary/decks/DeckGrid";
import type { DeckCounts } from "@/hooks/useDeckData";
import type { DeckListItem } from "@/lib/decks/queries";

interface DecksTabProps {
  decks: DeckListItem[];
  counts: DeckCounts;
  loading: boolean;
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

export function DecksTab({
  decks,
  counts,
  loading,
  onStudy,
  onManage,
  onEdit,
  onDelete,
  onCreateNew,
  onStudyHover,
  onManageHover,
  onEditHover,
  onCreateNewHover,
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
      <div className="rounded-3xl border border-dashed border-border-default bg-surface-sunken p-12 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-raised border border-border-subtle shadow-xs">
            <BookOpen size={24} className="text-fg-subtle" />
          </div>
          <div>
            <p className="font-heading text-body-lg font-bold text-fg">No tienes mazos aún</p>
            <p className="text-body-sm text-fg-muted mt-1">Agrupa palabras por tema o nivel y repásalas juntas.</p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onCreateNew} className="mt-2">
            Crear mazo
          </Button>
        </div>
      </div>
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
        onStudyHover={onStudyHover}
        onManageHover={onManageHover}
        onEditHover={onEditHover}
        onCreateNewHover={onCreateNewHover}
      />
    </>
  );
}
