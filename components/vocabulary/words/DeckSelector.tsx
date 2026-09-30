"use client";

// Planned structure:
// <DeckSelector>
//   <TriggerButton: ColorDot + DeckName + ChevronIcon />
//   <FloatingDropdownMenu: SearchInput + OptionsList(ColorDot + Name + Checkmark) + CreateNewDeckOption />
// </DeckSelector>

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { DeckSummary } from "@/lib/decks/queries";

const DECK_COLORS = [
  "bg-lilac",
  "bg-sky",
  "bg-mint",
  "bg-butter",
  "bg-coral",
];

interface DeckSelectorProps {
  decks: DeckSummary[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  onCreateDeck?: (name: string) => Promise<string | null>;
}

export function DeckSelector({
  decks,
  selectedId,
  onChange,
  onCreateDeck,
}: DeckSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = decks.find((d) => d.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filteredDecks = decks.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const getDeckDotColor = (index: number) => {
    return DECK_COLORS[index % DECK_COLORS.length];
  };

  const handleCreate = async (name: string) => {
    if (!onCreateDeck || !name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const newId = await onCreateDeck(name.trim());
      if (newId) onChange(newId);
      setOpen(false);
      setSearch("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 text-body-sm font-semibold text-fg outline-none transition-all hover:bg-surface-sunken focus:border-primary focus:ring-2 focus:ring-primary/20",
          open && "border-primary ring-2 ring-primary/20",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span
            className={cn(
              "h-3 w-3 rounded-full shrink-0",
              selectedId === null
                ? "bg-neutral-400 dark:bg-neutral-500"
                : getDeckDotColor(decks.findIndex((d) => d.id === selectedId)),
            )}
          />
          <span className="truncate">
            {selected ? selected.name : "Sin deck"}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 w-full rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-2xl"
        >
          <div className="relative mb-2">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Buscar o crear un deck..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border-subtle bg-surface-sunken py-2 pl-9 pr-3 text-body-sm text-fg placeholder:text-fg-subtle outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            <button
              type="button"
              role="option"
              aria-selected={selectedId === null}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-body-sm font-semibold transition-colors",
                selectedId === null
                  ? "bg-surface-sunken text-fg"
                  : "text-fg-muted hover:bg-surface-sunken/60 hover:text-fg",
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="h-3 w-3 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" />
                <span className="truncate">Sin deck</span>
              </div>
              {selectedId === null && <Check size={16} className="text-fg shrink-0" />}
            </button>

            {filteredDecks.map((deck, idx) => {
              const isSelected = selectedId === deck.id;
              const dotColor = getDeckDotColor(idx);
              return (
                <button
                  key={deck.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(deck.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-body-sm font-semibold transition-colors",
                    isSelected
                      ? "bg-surface-sunken text-fg"
                      : "text-fg-muted hover:bg-surface-sunken/60 hover:text-fg",
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={cn("h-3 w-3 rounded-full shrink-0", dotColor)} />
                    <span className="truncate">{deck.name}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-fg shrink-0" />}
                </button>
              );
            })}
          </div>

          {onCreateDeck && (
            <div className="mt-1 pt-1 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => void handleCreate(search || "Nuevo deck")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-body-sm font-semibold text-primary hover:bg-primary-soft transition-colors"
              >
                <Plus size={16} />
                <span>
                  {search.trim() ? `Crear deck "${search.trim()}"` : "Crear deck nuevo"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
