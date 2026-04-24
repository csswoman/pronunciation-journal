"use client";
import { Play, Clock, Settings2, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";

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
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] overflow-hidden transition-all hover:shadow-lg hover:border-[var(--primary)]/30 flex flex-col">
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${deck.icon ? "text-xl" : "text-base text-white"}`}
            style={{ background: deck.color ?? "var(--primary)" }}
          >
            {deck.icon ?? deck.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-[var(--deep-text)] truncate leading-tight">{deck.name}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{deck.description || "Vocabulary set"}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={onManage}
              title="Manage words"
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--deep-text)] transition-colors"
            >
              <BookOpen size={16} />
            </Button>
            <Button
              onClick={onEdit}
              title="Edit deck"
              className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--deep-text)] transition-colors"
            >
              <Settings2 size={16} />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {entryCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[var(--text-secondary)]">Progress</span>
              <span className="text-[var(--text-tertiary)]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[var(--btn-regular-bg)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%`, background: deck.color ?? "var(--primary)" }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Clock size={13} />
            <span>{entryCount} word{entryCount !== 1 ? "s" : ""}</span>
          </div>
          {dueCount > 0 && (
            <>
              <span className="text-[var(--line-divider)]">|</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30">
                <Clock size={12} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-semibold">{dueCount} due today</span>
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={onStudy}
          disabled={!canStudy}
          title={!canStudy ? "Add words to study" : ""}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-auto ${
            canStudy
              ? "bg-[var(--primary)] text-white hover:opacity-90 hover:shadow-md"
              : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
          }`}
        >
          <Play size={15} className="fill-current" />
          {dueCount > 0 ? `Review (${dueCount} due)` : "Study"}
        </Button>
      </div>
    </div>
  );
}
