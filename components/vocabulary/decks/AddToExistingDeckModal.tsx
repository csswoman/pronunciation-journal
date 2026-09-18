"use client";

import { useState } from "react";
import { X, Check } from "@/components/icons";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { addWordsToDeck, type DeckListItem } from "@/lib/decks/queries";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { getDeckIconComponent } from "./deck-palette";

interface AddToExistingDeckModalProps {
  wordIds: string[];
  decks: DeckListItem[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddToExistingDeckModal({ wordIds, decks, onClose, onAdded }: AddToExistingDeckModalProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!selectedDeckId) return;
    setSaving(true);
    setError("");
    try {
      await addWordsToDeck(wordIds, selectedDeckId);
      onAdded();
    } catch {
      setError(publicDataErrorMessage());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <H2 className="font-heading font-bold text-body-lg">Agregar a mazo</H2>
            <p className="text-caption text-fg-subtle mt-0.5">{wordIds.length} palabra{wordIds.length !== 1 ? "s" : ""} seleccionada{wordIds.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {decks.length === 0 ? (
          <p className="text-body-sm text-fg-subtle text-center py-4">No tienes mazos aún. Crea uno primero.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {decks.map(deck => {
              const DeckIconComp = getDeckIconComponent(deck.icon);
              const isSelected = selectedDeckId === deck.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    isSelected ? "border-primary bg-surface-sunken" : "border-border-subtle bg-surface-sunken/50 hover:bg-surface-sunken"
                  }`}
                >
                  <div
                    data-tone={deck.color}
                    className="pastel-card flex size-9 items-center justify-center rounded-xl shrink-0 text-ink shadow-2xs"
                  >
                    <DeckIconComp size={18} className="text-ink" />
                  </div>
                  <span className="text-body-sm font-medium text-fg flex-1 truncate">{deck.name}</span>
                  {isSelected && (
                    <Check size={16} className="text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-caption text-error">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => void handleAdd()}
            disabled={!selectedDeckId || saving || decks.length === 0}
          >
            {saving ? "Agregando..." : "Agregar a mazo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

