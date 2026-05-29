"use client";

import { useEffect, useRef, useState } from "react";
import { BookMarked, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DeckSummary } from "@/lib/decks/queries";

interface DeckSelectorProps {
  decks: DeckSummary[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

export function DeckSelector({ decks, selectedId, onChange }: DeckSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = decks.find(d => d.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => decks.length > 0 && setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[--radius-sm]",
          "border border-[--border] bg-[--surface-raised]",
          "px-2.5 py-1.5 text-xs font-medium text-[--text-primary]",
          "transition-colors duration-150 max-w-44 truncate",
          decks.length > 0 ? "cursor-pointer hover:bg-[--surface-sunken]" : "cursor-default opacity-60",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <BookMarked size={12} className="shrink-0 text-[--primary]" />
        <span className="truncate">
          {selected ? selected.name : decks.length > 0 ? "No deck" : "No decks yet"}
        </span>
        {decks.length > 0 && (
          <ChevronDown
            size={11}
            className={cn(
              "shrink-0 text-[--text-tertiary] transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && decks.length > 0 && (
        <ul
          role="listbox"
          className={cn(
            "absolute bottom-[calc(100%+6px)] left-0 z-20",
            "min-w-44 max-h-48 overflow-y-auto py-1",
            "rounded-[--radius-sm] border border-[--border]",
            "bg-[--surface-raised] shadow-[--shadow-lg]",
          )}
        >
          <li>
            <button
              role="option"
              aria-selected={selectedId === null}
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs transition-colors duration-100",
                selectedId === null
                  ? "bg-[--primary-50] text-[--primary] font-medium"
                  : "text-[--text-secondary] hover:bg-[--surface-sunken]",
              )}
            >
              No deck
            </button>
          </li>
          {decks.map(deck => (
            <li key={deck.id}>
              <button
                role="option"
                aria-selected={selectedId === deck.id}
                type="button"
                onClick={() => { onChange(deck.id); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs transition-colors duration-100",
                  selectedId === deck.id
                    ? "bg-[--primary-50] text-[--primary] font-medium"
                    : "text-[--fg] hover:bg-[--surface-sunken]",
                )}
              >
                {deck.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
