"use client";

// Planned structure:
// <QuickAddModal>
//   <Backdrop />
//   <ModalContainer: Header(Kicker + BricolageTitle + SparkleSubtitle + RoundCloseButton) />
//   <ModalForm: PalabraOrFraseInput + DeckSelectorField + ContextTextarea + DuplicateErrorAlert />
//   <ModalFooter: KeyboardHint + CancelButton + SubmitButton />
// </QuickAddModal>

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Pencil } from "@/components/icons";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserDecks, createDeck, type DeckSummary } from "@/lib/decks/queries";
import { DuplicateWordError } from "@/lib/word-bank/queries";
import { DeckSelector } from "./DeckSelector";
import { QuickAddSuccessState } from "./QuickAddSuccessState";

export interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; context?: string | null; deckId?: string | null }) => Promise<void> | void;
  initialText?: string;
  contextLabel?: string;
  onEditExisting?: (wordId: string) => void;
}

export function QuickAddModal({
  open,
  onClose,
  onSubmit,
  initialText = "",
  contextLabel = "TRACKING",
  onEditExisting,
}: QuickAddModalProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ wordId: string; text: string } | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    getUserDecks(user.id).then(setDecks);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setContext("");
    setSuccess(false);
    setIsSaving(false);
    setSaveError(null);
    setDuplicate(null);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open, initialText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSaving, open, onClose]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSaving || duplicate) return;
    setIsSaving(true);
    setSaveError(null);
    setDuplicate(null);
    try {
      await onSubmit({ text: trimmed, context: context.trim() || null, deckId: selectedDeckId });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (cause) {
      if (cause instanceof DuplicateWordError) {
        setDuplicate({ wordId: cause.wordId, text: cause.text });
      } else {
        setSaveError("No pudimos guardar la palabra. Inténtalo de nuevo.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDeck = async (name: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const newDeck = await createDeck({
        name,
        userId: user.id,
        color: "lilac",
        icon: "book",
      });
      setDecks((prev) => [newDeck, ...prev]);
      return newDeck.id;
    } catch {
      return null;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_150ms_ease-out]"
      onClick={() => !isSaving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg overflow-visible rounded-[28px] border border-border-subtle bg-surface-raised p-6 sm:p-7 shadow-2xl transition-all",
        )}
      >
        {success ? (
          <QuickAddSuccessState word={text.trim()} />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="font-mono text-overline font-semibold uppercase tracking-wider text-fg-subtle">
                  {contextLabel}
                </span>
                <h2 id="modal-title" className="font-display text-2xl font-bold text-fg mt-0.5">
                  Guardar palabra
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-body-sm font-medium text-fg-muted">
                  <Sparkles size={15} className="text-primary shrink-0" />
                  <span>Añadiremos el significado, la IPA y un ejemplo.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && onClose()}
                disabled={isSaving}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-bold text-fg mb-1.5">
                  Palabra o frase
                </label>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setDuplicate(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  aria-invalid={duplicate ? true : undefined}
                  placeholder="Por ejemplo: resilient"
                  className={cn(
                    "w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-md font-medium text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
                  )}
                />
              </div>

              <div>
                <label className="block text-body-sm font-bold text-fg mb-1.5">
                  Deck
                </label>
                <DeckSelector
                  decks={decks}
                  selectedId={selectedDeckId}
                  onChange={setSelectedDeckId}
                  onCreateDeck={handleCreateDeck}
                />
              </div>

              <div>
                <label className="block text-body-sm font-bold text-fg mb-1.5">
                  Contexto <span className="font-normal text-fg-subtle">· opcional</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  rows={2}
                  placeholder="La frase o situación donde la encontraste."
                  className={cn(
                    "w-full resize-none rounded-2xl border border-border-subtle bg-surface-sunken/80 p-3.5 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[90px]",
                  )}
                />
              </div>

              {duplicate ? (
                <div role="alert" className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-sunken p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-body-sm text-fg">
                    Ya tienes <span className="font-bold">{duplicate.text}</span> en tu lista.
                  </p>
                  {onEditExisting ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil size={13} />}
                      className="shrink-0"
                      onClick={() => onEditExisting(duplicate.wordId)}
                    >
                      Editar la que ya tienes
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {saveError ? <p role="alert" className="text-body-sm text-error font-medium">{saveError}</p> : null}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5 text-caption font-medium text-fg-muted">
                <kbd className="font-mono text-caption px-2 py-0.5 border border-border-subtle bg-surface-sunken rounded-md font-semibold text-fg">
                  Enter
                </kbd>
                <span>para guardar</span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => !isSaving && onClose()}
                  disabled={isSaving}
                  className="focus-ring rounded-full px-5 py-2 text-body-sm font-semibold border border-border-subtle bg-surface-raised hover:bg-surface-sunken text-fg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  aria-label="Guardar palabra"
                  onClick={() => void handleSubmit()}
                  disabled={!text.trim() || isSaving || Boolean(duplicate)}
                  className="focus-ring rounded-full px-5 py-2 bg-primary text-on-primary font-semibold text-body-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {isSaving ? "Guardando..." : "Guardar palabra ↵"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
