"use client";

import { useState } from "react";
import { Play, MoreVertical, BookOpen, Settings2, Trash2 } from "@/components/icons";
import type { DeckListItem } from "@/lib/decks/queries";
import { cn } from "@/lib/cn";
import { getDeckIconComponent } from "./deck-palette";

interface DeckCardProps {
  deck: DeckListItem;
  entryCount: number;
  dueCount?: number;
  masteredCount?: number;
  onStudy: () => void;
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStudyHover?: () => void;
  onManageHover?: () => void;
  onEditHover?: () => void;
}

const PASTEL_TONES = ['lilac', 'sky', 'mint', 'coral', 'butter'] as const;

function getToneForDeck(color?: string, name?: string) {
  if (color) {
    if (color.includes('6366f1') || color.includes('3b82f6') || color.includes('06b6d4')) return 'sky';
    if (color.includes('8b5cf6') || color.includes('ec4899')) return 'lilac';
    if (color.includes('f43f5e') || color.includes('f97316')) return 'coral';
    if (color.includes('22c55e') || color.includes('14b8a6')) return 'mint';
    if (color.includes('eab308')) return 'butter';
  }
  let hash = 0;
  const str = name || 'deck';
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  return PASTEL_TONES[Math.abs(hash) % PASTEL_TONES.length];
}

function getDeckSampleWords(name: string): string[] {
  const n = name.toLowerCase();
  if (n.includes('creativity') || n.includes('mind') || n.includes('design')) return ['catalyst', 'tangible', 'insight'];
  if (n.includes('software') || n.includes('dev') || n.includes('code') || n.includes('tech')) return ['deploy', 'rollback', 'merge'];
  if (n.includes('house') || n.includes('home') || n.includes('daily')) return ['laundry', 'sink', 'shelf'];
  if (n.includes('work') || n.includes('business') || n.includes('job')) return ['pitch', 'funnel', 'agenda'];
  return ['concept', 'practice', 'target'];
}

export function DeckCard({
  deck,
  entryCount,
  dueCount = 0,
  masteredCount = 0,
  onStudy,
  onManage,
  onEdit,
  onDelete,
  onStudyHover,
  onManageHover,
  onEditHover,
}: DeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canStudy = entryCount > 0;
  const tone = getToneForDeck(deck.color ?? undefined, deck.name);
  const sampleWords = getDeckSampleWords(deck.name);
  const DeckIconComp = getDeckIconComponent(deck.icon);

  const totalSegments = 8;
  const filledSegments = entryCount > 0 ? Math.min(totalSegments, Math.max(1, Math.round((masteredCount / entryCount) * totalSegments))) : 0;

  return (
    <div
      data-tone={tone}
      className="pastel-card group relative flex flex-col justify-between gap-3.5 rounded-3xl p-5 border border-ink/10 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md select-none min-h-[175px]"
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-ink/10 flex items-center justify-center font-bold text-ink shrink-0 text-body-sm shadow-2xs">
              <DeckIconComp size={18} className="text-ink" />
            </div>
            <h3 className="font-heading text-body-md font-bold text-ink truncate leading-tight">
              {deck.name}
            </h3>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Opciones"
              className="focus-ring flex size-8 items-center justify-center rounded-full text-ink/70 hover:bg-ink/10 hover:text-ink transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-ink/15 bg-paper p-1.5 shadow-xl shadow-ink/10 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onManage(); }}
                    onMouseEnter={onManageHover}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-caption font-bold text-ink hover:bg-ink/5 transition-colors text-left"
                  >
                    <BookOpen size={14} className="text-ink/70" />
                    <span>Gestionar palabras</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    onMouseEnter={onEditHover}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-caption font-bold text-ink hover:bg-ink/5 transition-colors text-left"
                  >
                    <Settings2 size={14} className="text-ink/70" />
                    <span>Editar mazo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-caption font-bold text-error hover:bg-error/10 transition-colors text-left"
                  >
                    <Trash2 size={14} className="text-error" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Chip */}
        <div>
          {dueCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-ink px-3 py-0.5 font-mono text-tiny font-bold text-paper shadow-2xs">
              {dueCount} para repasar hoy
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-0.5 font-mono text-tiny font-bold text-ink">
              {entryCount === 0 ? "Sin empezar" : "Al día"}
            </span>
          )}
        </div>

        {/* 3 Sample Words (White pills with ink border) */}
        <div className="flex flex-wrap gap-1.5 my-0.5">
          {sampleWords.map((word) => (
            <span
              key={word}
              className="inline-flex items-center rounded-full bg-paper text-ink border border-ink/25 px-2.5 py-0.5 font-mono text-tiny font-medium shadow-2xs"
            >
              {word}
            </span>
          ))}
        </div>

        {/* Segmented Progress Bar */}
        <div className="flex items-center gap-1 w-full my-0.5">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < filledSegments ? "bg-ink" : "bg-ink/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-tiny font-sans text-ink">
        <span className="font-mono font-semibold opacity-80">
          {masteredCount > 0 ? `${masteredCount} de ${entryCount} vistas` : `${entryCount} palabras nuevas`}
        </span>
        <button
          type="button"
          onClick={onStudy}
          onMouseEnter={onStudyHover}
          onFocus={onStudyHover}
          disabled={!canStudy}
          title={!canStudy ? "Añade palabras para estudiar" : "Estudiar mazo"}
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-caption font-bold transition-all select-none shadow-xs",
            canStudy
              ? "bg-ink text-paper hover:bg-ink-secondary active:scale-95"
              : "bg-ink/20 text-ink/50 cursor-not-allowed"
          )}
        >
          <Play size={12} className="fill-current" />
          <span>Estudiar</span>
        </button>
      </div>
    </div>
  );
}
