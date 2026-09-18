"use client";

import { useState } from "react";
import { X, Check, Trash2 } from "@/components/icons";
import { updateDeck, type DeckListItem } from "@/lib/decks/queries";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { DECK_COLORS, DECK_ICONS, ICON_MAP, normalizeDeckTone, normalizeDeckIcon, type DeckIconKey, type DeckColorTone } from "./deck-palette";
import { cn } from "@/lib/cn";

interface EditDeckModalProps {
  deck: DeckListItem;
  wordCount?: number;
  dueCount?: number;
  onClose: () => void;
  onUpdated: (deck: DeckListItem) => void;
  onDelete: () => void;
}

export function EditDeckModal({
  deck,
  wordCount = 12,
  dueCount = 3,
  onClose,
  onUpdated,
  onDelete,
}: EditDeckModalProps) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? "");
  const [color, setColor] = useState<DeckColorTone>(() => normalizeDeckTone(deck.color, deck.name));
  const [icon, setIcon] = useState<DeckIconKey>(() => normalizeDeckIcon(deck.icon));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const SelectedIcon = ICON_MAP[icon] ?? ICON_MAP.book;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await updateDeck(deck.id, {
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
      });
      onUpdated(data);
    } catch {
      setError(publicDataErrorMessage());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-border-default bg-surface-raised p-6 sm:p-7 shadow-2xl space-y-5 select-none">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-extrabold text-fg">Editar mazo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="focus-ring flex size-9 items-center justify-center rounded-full bg-surface-sunken text-fg-muted hover:bg-surface-hover hover:text-fg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tarjeta de previsualización en vivo */}
        <div
          data-tone={color}
          className="pastel-card flex items-center justify-between gap-3 rounded-2xl p-4 border border-ink/10 shadow-xs transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-11 items-center justify-center rounded-xl bg-ink/10 text-ink shrink-0 shadow-2xs">
              <SelectedIcon size={20} className="text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-body-md font-bold text-ink truncate leading-snug">
                {name.trim() || "Nombre del mazo"}
              </p>
              <p className="font-sans text-tiny font-medium text-ink/70 truncate">
                {wordCount} palabras · {dueCount} para repasar hoy
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-paper/40 border border-ink/15 px-3 py-1 font-mono text-tiny font-bold text-ink shrink-0">
            Así se verá
          </span>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted mb-1.5 block">
              Nombre
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Creativity Mind..."
              className="w-full rounded-2xl border border-border-default bg-surface-sunken px-4 py-3 font-sans text-body-md text-fg placeholder:text-fg-muted transition-all focus:border-border-strong focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted mb-1.5 block">
              Descripción · Opcional
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Para qué usas este mazo..."
              className="w-full rounded-2xl border border-border-default bg-surface-sunken px-4 py-3 font-sans text-body-sm text-fg placeholder:text-fg-muted transition-all focus:border-border-strong focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Selector de Icono */}
          <div>
            <label className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted mb-2 block">
              Icono
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {DECK_ICONS.map((iconKey) => {
                const IconComp = ICON_MAP[iconKey];
                const isActive = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={cn(
                      "focus-ring flex size-10 items-center justify-center rounded-2xl transition-all select-none",
                      isActive
                        ? "bg-ink text-paper shadow-xs scale-105"
                        : "bg-surface-sunken border border-border-subtle text-fg hover:bg-surface-raised hover:scale-105"
                    )}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <label className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted mb-2 block">
              Color
            </label>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {DECK_COLORS.map((toneKey) => {
                  const isActive = color === toneKey;
                  return (
                    <button
                      key={toneKey}
                      type="button"
                      data-tone={toneKey}
                      onClick={() => setColor(toneKey)}
                      className={cn(
                        "pastel-card focus-ring relative size-10 rounded-2xl transition-all flex items-center justify-center shadow-xs",
                        isActive ? "ring-2 ring-ink ring-offset-2 scale-105" : "hover:scale-105"
                      )}
                    >
                      {isActive && <Check size={16} className="text-ink font-bold" />}
                    </button>
                  );
                })}
              </div>
              <span className="font-sans text-tiny text-fg-muted hidden sm:block">
                El color del mazo no cambia con tu tema.
              </span>
            </div>
          </div>
        </div>

        {error && <p className="font-sans text-caption text-error">{error}</p>}

        {/* Acciones de pie */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle/60">
          <button
            type="button"
            onClick={onDelete}
            className="focus-ring flex items-center gap-1.5 font-sans text-caption font-bold text-fg-muted hover:text-destructive transition-colors"
          >
            <Trash2 size={15} />
            <span>Eliminar mazo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full px-5 py-2.5 font-sans text-body-sm font-bold bg-surface-sunken hover:bg-surface-hover text-fg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!name.trim() || saving}
              className="focus-ring rounded-full px-6 py-2.5 font-sans text-body-sm font-bold bg-primary hover:bg-primary/90 text-primary-fg transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


