"use client";

import { Settings2, Play, Trash2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

// Decorative background patterns as inline SVG data URIs
const BG_PATTERNS: Record<string, string> = {
  none: "",
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='white' fill-opacity='0.15'/%3E%3C/svg%3E")`,
  grid: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-opacity='0.12' stroke-width='1'/%3E%3C/svg%3E")`,
  waves: `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 C10 0, 30 0, 40 10 C30 20, 10 20, 0 10Z' fill='white' fill-opacity='0.08'/%3E%3C/svg%3E")`,
  diagonal: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='20' x2='20' y2='0' stroke='white' stroke-opacity='0.12' stroke-width='1.5'/%3E%3C/svg%3E")`,
};

export const DECK_PATTERNS = Object.keys(BG_PATTERNS) as DeckPattern[];
export type DeckPattern = keyof typeof BG_PATTERNS;

export const DECK_ICONS = ["📚", "🎯", "✈️", "💼", "🎨", "🏋️", "🍕", "🎵", "💡", "🌍", "🗣️", "📖", "🔬", "💻", "🏆"];

interface DeckCardProps {
  deck: Deck;
  entryCount: number;
  onStudy: () => void;
  onManage: () => void;
  onDelete: () => void;
}

export function DeckCard({ deck, entryCount, onStudy, onManage, onDelete }: DeckCardProps) {
  const canStudy = entryCount > 0;
  const deckColor = deck.color ?? "var(--primary)";

  // icon and pattern stored as JSON in description prefix: [icon][pattern]|actual description
  // Format: "🎯:dots|Travel vocabulary" — we parse icon/pattern from name metadata
  // Since DB schema doesn't have icon/pattern fields, we encode them in description
  // Format: "__meta:icon=🎯,pattern=dots__|actual description"
  let icon: string = deck.name[0].toUpperCase();
  let pattern: DeckPattern = "none";
  let displayDescription = deck.description ?? "";

  const metaMatch = deck.description?.match(/^__meta:([^_]+)__\|?([\s\S]*)/);
  if (metaMatch) {
    const metaStr = metaMatch[1];
    displayDescription = metaMatch[2] ?? "";
    const iconMatch = metaStr.match(/icon=([^,]+)/);
    const patternMatch = metaStr.match(/pattern=([^,]+)/);
    if (iconMatch) icon = iconMatch[1];
    if (patternMatch) pattern = patternMatch[1] as DeckPattern;
  }

  const bgPattern = BG_PATTERNS[pattern] || "";

  return (
    <div className="group bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
      {/* Colored header with decorative pattern */}
      <div
        className="relative h-16 flex items-end px-3 pb-2"
        style={{
          background: deckColor,
          backgroundImage: bgPattern,
        }}
      >
        {/* Manage button top-right */}
        <button
          onClick={onManage}
          title="Edit deck"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <Settings2 size={14} />
        </button>

        {/* Icon badge */}
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg leading-none select-none">
          {icon}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-sm text-[var(--deep-text)] truncate leading-tight">{deck.name}</p>
          {displayDescription && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-snug">{displayDescription}</p>
          )}
        </div>

        {/* Stats */}
        <p className="text-[11px] text-[var(--text-tertiary)] font-medium">
          {entryCount} word{entryCount !== 1 ? "s" : ""}
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={onStudy}
            disabled={!canStudy}
            title={!canStudy ? "Add words to study" : ""}
            className={`flex-1 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
              canStudy
                ? "bg-[var(--primary)] text-white hover:opacity-90"
                : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
            }`}
          >
            <Play size={12} className="fill-current" />
            Study
          </button>

          <button
            onClick={onDelete}
            title="Delete deck"
            className="p-2 rounded-xl text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
