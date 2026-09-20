"use client";

import type { Tables } from "@/lib/supabase/types";
import { BookOpen, CheckSquare, Minus, Search, Square, Trash2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import { EntryRow } from "./EntryRow";

type Entry = Tables<"entries">;

interface ManageVocabTabProps {
  loading: boolean;
  entries: Entry[];
  filter: string;
  selected: Set<string>;
  selectMode: boolean;
  onFilterChange: (value: string) => void;
  onToggleSelectAll: () => void;
  onBulkRemove: () => void;
  onToggleSelect: (id: string) => void;
  onRemoveWord: (id: string) => void;
  onSaveEntry: (id: string, phrases: string[], meaning: string) => Promise<void>;
  onChangeTab: (tab: "add" | "ai") => void;
}

export function ManageVocabTab(props: ManageVocabTabProps) {
  const { loading, entries, filter, selected, selectMode, onFilterChange, onToggleSelectAll, onBulkRemove, onToggleSelect, onRemoveWord, onSaveEntry, onChangeTab } = props;
  const filtered = entries.filter((e) => e.word.toLowerCase().includes(filter.toLowerCase()));
  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  return (
    <div className="p-6 space-y-4">
      {/* Buscador de palabras */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Buscar palabras..."
          className="w-full rounded-2xl border border-border-default bg-surface-sunken py-2.5 pl-9 pr-3.5 font-sans text-body-sm text-fg placeholder:text-fg-muted transition-all focus:border-border-strong focus:bg-surface-raised focus:outline-none"
        />
      </div>

      {filtered.length > 0 && !loading && (
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle/50 pb-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="focus-ring flex items-center gap-1.5 font-sans text-caption font-bold text-fg-muted hover:text-fg transition-colors"
          >
            {allFilteredSelected ? (
              <CheckSquare size={16} className="text-primary" />
            ) : selected.size > 0 ? (
              <Minus size={16} className="text-fg-subtle" />
            ) : (
              <Square size={16} />
            )}
            <span>{allFilteredSelected ? "Desmarcar todas" : "Seleccionar todas"}</span>
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={onBulkRemove}
              className="focus-ring flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-caption font-bold text-error bg-error-soft hover:bg-error-soft/80 transition-colors"
            >
              <Trash2 size={13} />
              <span>Eliminar seleccionadas ({selected.size})</span>
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-surface-sunken animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 && entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-sunken border border-border-subtle shadow-xs">
            <BookOpen size={24} className="text-fg-subtle" />
          </div>
          <div>
            <p className="font-heading text-body-md font-bold text-fg">No hay palabras aún</p>
            <p className="font-sans text-body-sm text-fg-muted mt-0.5">Agrega palabras manualmente o usa sugerencias IA</p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <Button variant="primary" size="sm" onClick={() => onChangeTab("add")} className="!rounded-full font-bold">
              Agregar palabra
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onChangeTab("ai")} className="!rounded-full font-bold">
              Sugerencias IA
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center font-sans text-caption text-fg-subtle py-8">No se encontraron palabras coincidentes</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              selected={selected.has(entry.id)}
              onToggleSelect={onToggleSelect}
              onRemove={onRemoveWord}
              onSaveEntry={onSaveEntry}
              selectMode={selectMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

