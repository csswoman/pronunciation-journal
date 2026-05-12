"use client";
import { Play, Settings2, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";
import ProgressBar from "@/components/ui/ProgressBar";

type Deck = Tables<"decks">;

interface DeckCardProps {
  deck: Deck;
  entryCount: number;
  dueCount?: number;
  masteredCount?: number;
  onStudy: () => void;
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DeckCard({
  deck,
  entryCount,
  dueCount = 0,
  masteredCount = 0,
  onStudy,
  onManage,
  onEdit,
}: DeckCardProps) {
  const canStudy = entryCount > 0;
  const progressPercent = entryCount > 0 ? Math.round((masteredCount / entryCount) * 100) : 0;

  return (
    <div className="bg-[var(--card-bg)] rounded-[var(--radius-lg)] border border-[var(--line-divider)] overflow-hidden transition-all hover:shadow-lg hover:border-[var(--primary)] flex flex-col">
      <div className="px-4 py-3 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${deck.icon ? "text-xl" : "text-base text-on-primary"}`}
            style={{ background: deck.color ?? "var(--primary)" }}
          >
            {deck.icon ?? deck.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-fg truncate leading-tight">{deck.name}</p>
            <p className="text-xs text-fg-subtle mt-0.5">{deck.description || "Vocabulary set"}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onManage} title="Manage words">
              <BookOpen size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} title="Edit deck">
              <Settings2 size={16} />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-fg-muted">Progress</span>
            <span className="text-fg-subtle">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} color="var(--primary)" height="xs" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
        <span className="text-[13px] text-fg-subtle">
          {entryCount} word{entryCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="primary"
          onClick={onStudy}
          disabled={!canStudy}
          title={!canStudy ? "Add words to study" : ""}
          icon={<Play size={15} className="fill-current" />}
          className="ml-auto px-3 py-1.5 !text-[13px] !rounded-[var(--radius-sm)]"
        >
          Study
        </Button>
        </div>
      </div>
    </div>
  );
}
