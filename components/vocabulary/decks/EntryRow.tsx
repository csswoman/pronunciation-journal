"use client";

import { useState } from "react";
import type { Tables } from "@/lib/supabase/types";
import { Check, CheckSquare, ChevronUp, Pencil, Square, Trash2, Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import { speakWord } from "@/lib/word-bank/speech";

type Entry = Tables<"entries">;

interface EntryRowProps {
  entry: Entry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSaveEntry: (id: string, phrases: string[], meaning: string) => Promise<void>;
  selectMode: boolean;
}

export function EntryRow({ entry, selected, onToggleSelect, onRemove, onSaveEntry, selectMode }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingPhrases, setEditingPhrases] = useState("");
  const [editingMeaning, setEditingMeaning] = useState("");
  const [saving, setSaving] = useState(false);

  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  const firstMeaning = meanings[0] as { partOfSpeech?: string; definitions?: { definition?: string }[] } | undefined;
  const pos = firstMeaning?.partOfSpeech;
  const currentDefinition = firstMeaning?.definitions?.[0]?.definition ?? "";

  const openEdit = () => {
    setEditingPhrases(entry.phrases ? entry.phrases.join("\n") : "");
    setEditingMeaning(currentDefinition);
    setExpanded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const phrases = editingPhrases.trim() ? editingPhrases.split("\n").map((p) => p.trim()).filter(Boolean) : [];
    try {
      await onSaveEntry(entry.id, phrases, editingMeaning.trim());
      setExpanded(false);
    } catch {
      // The drawer owns the visible error message.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border-default/80 bg-surface-sunken/60 hover:border-border-strong hover:bg-surface-raised"
      }`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <button
          type="button"
          onClick={() => onToggleSelect(entry.id)}
          aria-label={selected ? "Desmarcar palabra" : "Seleccionar palabra"}
          className={`flex-shrink-0 focus-ring rounded-lg transition-opacity ${
            selectMode ? "opacity-100" : "opacity-40 group-hover:opacity-100"
          }`}
        >
          {selected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-fg-subtle" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-body-md font-bold text-fg">{entry.word}</span>
            {pos && (
              <span className="text-tiny px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary font-bold">
                {pos}
              </span>
            )}
          </div>
          {entry.ipa && <p className="font-phoneme text-caption text-fg-subtle mt-0.5">/{entry.ipa}/</p>}
          {!expanded && currentDefinition && <p className="font-sans text-caption text-fg-muted truncate mt-0.5">{currentDefinition}</p>}
          {!expanded && entry.phrases && entry.phrases.length > 0 && (
            <p className="font-sans text-caption text-fg-muted truncate mt-0.5 italic">
              "{entry.phrases[0]}"{entry.phrases.length > 1 ? ` (+${entry.phrases.length - 1})` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => speakWord(entry.word)}
            aria-label="Pronunciar palabra"
            className="focus-ring flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Volume2 size={15} />
          </button>
          <button
            type="button"
            onClick={expanded ? () => setExpanded(false) : openEdit}
            aria-label={expanded ? "Cerrar edición" : "Editar palabra"}
            className={`focus-ring flex size-8 items-center justify-center rounded-xl transition-colors ${
              expanded
                ? "bg-primary text-primary-fg"
                : "bg-surface-sunken text-fg-subtle hover:text-fg hover:bg-surface-raised border border-border-subtle"
            }`}
          >
            {expanded ? <ChevronUp size={15} /> : <Pencil size={15} />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label="Eliminar palabra"
            className="focus-ring flex size-8 items-center justify-center rounded-xl text-fg-subtle hover:text-error hover:bg-error-soft transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-border-subtle/60 pt-3">
          <div>
            <label className="block font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider mb-1">
              Significado / Definición
            </label>
            <textarea
              autoFocus
              value={editingMeaning}
              onChange={(e) => setEditingMeaning(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface-sunken border border-border-default font-sans text-body-sm text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div>
            <label className="block font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider mb-1">
              Frases de ejemplo (una por línea)
            </label>
            <textarea
              value={editingPhrases}
              onChange={(e) => setEditingPhrases(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface-sunken border border-border-default font-sans text-body-sm text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)} className="!rounded-full font-bold">
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              icon={saving ? undefined : <Check size={13} />}
              className="!rounded-full font-bold"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
