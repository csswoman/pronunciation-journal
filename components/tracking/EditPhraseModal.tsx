"use client";

// Planned structure:
// <EditPhraseModal>
//   <Backdrop />
//   <ModalContainer: Header(Icon + BricolageTitle + Subtitle + RoundCloseButton) />
//   <ModalForm: PhraseTextArea + AIEnrichButton + IPA + Translation + Meaning + Context />
//   <ModalFooter: NoticeText + CancelButton + SaveButton />
// </EditPhraseModal>

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, FileText, Sparkles, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackedItem } from "@/lib/tracking/types";

interface Props {
  trackedItem: TrackedItem | null;
  onClose: () => void;
  onSubmit: (id: string, updates: { title?: string | null; payload?: Record<string, unknown> }) => Promise<void>;
}

export function EditPhraseModal({ trackedItem, onClose, onSubmit }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [ipa, setIpa] = useState("");
  const [translation, setTranslation] = useState("");
  const [meaning, setMeaning] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackedItem) return;
    const payload = trackedItem.payload ?? {};
    const phraseText = (typeof payload.text === "string" ? payload.text : trackedItem.title) ?? "";
    setText(phraseText);
    setIpa(typeof payload.ipa === "string" ? payload.ipa.replace(/^\/+|\/+$/g, "") : "");
    setTranslation(typeof payload.translation === "string" ? payload.translation : "");
    setMeaning(typeof payload.meaning === "string" ? payload.meaning : "");
    setContext(typeof payload.context === "string" ? payload.context : "");
    setSaving(false);
    setEnriching(false);
    setError(null);
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [trackedItem]);

  useEffect(() => {
    if (!trackedItem) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !enriching) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [enriching, onClose, saving, trackedItem]);

  if (!trackedItem) return null;

  const handleEnrich = async () => {
    const targetText = text.trim();
    if (!targetText || enriching) return;
    setEnriching(true);
    setError(null);
    try {
      const res = await fetch("/api/gemini/tracking-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: targetText,
          context: context.trim() || undefined,
          kind: "phrase",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el enriquecimiento");
      }

      const data = (await res.json()) as {
        ipa?: string;
        translation?: string;
        meaning?: string;
        context?: string;
        explanationEs?: string;
      };

      if (data.ipa) setIpa(data.ipa.replace(/^\/+|\/+$/g, ""));
      if (data.translation) setTranslation(data.translation);
      if (data.meaning || data.explanationEs) {
        setMeaning(data.meaning || data.explanationEs || "");
      }
      if (data.context && !context.trim()) setContext(data.context);
    } catch {
      setError("No pudimos enriquecer la frase con IA. Inténtalo de nuevo.");
    } finally {
      setEnriching(false);
    }
  };

  const submit = async () => {
    const nextText = text.trim();
    if (!nextText || saving || enriching) return;
    setSaving(true);
    setError(null);
    try {
      const nextPayload: Record<string, unknown> = {
        ...(trackedItem.payload ?? {}),
        text: nextText,
        ...(ipa.trim() ? { ipa: ipa.trim() } : {}),
        ...(translation.trim() ? { translation: translation.trim() } : {}),
        ...(meaning.trim() ? { meaning: meaning.trim() } : {}),
        ...(context.trim() ? { context: context.trim() } : {}),
      };
      if (!ipa.trim()) delete nextPayload.ipa;
      if (!translation.trim()) delete nextPayload.translation;
      if (!meaning.trim()) delete nextPayload.meaning;
      if (!context.trim()) delete nextPayload.context;

      await onSubmit(trackedItem.id, {
        title: nextText,
        payload: nextPayload,
      });
      onClose();
    } catch {
      setError("No pudimos guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_150ms_ease-out]"
      onClick={() => !saving && !enriching && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-phrase-title"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-border-subtle bg-surface-raised p-6 sm:p-7 shadow-2xl transition-all"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FileText size={18} aria-hidden />
            </span>
            <div>
              <span className="font-mono text-overline font-semibold uppercase tracking-wider text-fg-subtle">
                TRACKING
              </span>
              <h2 id="edit-phrase-title" className="font-display text-2xl font-bold text-fg mt-0.5">
                Editar frase
              </h2>
              <p className="mt-1 text-body-sm text-fg-muted font-medium">
                Modifica el texto o enriquece su fonética y significado con IA.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || enriching}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="edit-phrase-text" className="text-body-sm font-bold text-fg">
                Frase en inglés
              </label>
              <button
                type="button"
                onClick={() => void handleEnrich()}
                disabled={!text.trim() || enriching || saving}
                aria-label="Enriquecer con IA"
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-caption font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <Sparkles size={13} className={enriching ? "animate-spin" : ""} aria-hidden />
                <span>{enriching ? "Enriqueciendo…" : "Enriquecer con IA"}</span>
              </button>
            </div>
            <textarea
              ref={inputRef}
              id="edit-phrase-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
              placeholder="e.g. Break a leg"
              className="w-full resize-none rounded-2xl border border-border-subtle bg-surface-sunken/80 p-3.5 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-phrase-ipa" className="block text-body-sm font-bold text-fg mb-1.5">
                Transcripción IPA <span className="font-normal text-fg-subtle">(opcional)</span>
              </label>
              <input
                id="edit-phrase-ipa"
                value={ipa}
                onChange={(event) => setIpa(event.target.value)}
                placeholder="e.g. breɪk ə lɛɡ"
                className="font-ipa w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="edit-phrase-translation" className="block text-body-sm font-bold text-fg mb-1.5">
                Traducción al español <span className="font-normal text-fg-subtle">(opcional)</span>
              </label>
              <input
                id="edit-phrase-translation"
                value={translation}
                onChange={(event) => setTranslation(event.target.value)}
                placeholder="e.g. Buena suerte"
                className="w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-phrase-meaning" className="block text-body-sm font-bold text-fg mb-1.5">
              Significado / Nota de uso <span className="font-normal text-fg-subtle">(opcional)</span>
            </label>
            <textarea
              id="edit-phrase-meaning"
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
              rows={2}
              placeholder="e.g. Used to wish good luck to actors before a performance."
              className="w-full resize-none rounded-2xl border border-border-subtle bg-surface-sunken/80 p-3.5 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="edit-phrase-context" className="block text-body-sm font-bold text-fg mb-1.5">
              Contexto / Dónde la escuchaste <span className="font-normal text-fg-subtle">(opcional)</span>
            </label>
            <input
              id="edit-phrase-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="e.g. In a theater before the show"
              className="w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error ? (
            <p role="alert" className="text-body-sm text-error font-medium">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="mt-6 pt-4 border-t border-border-subtle flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || enriching}
            className="focus-ring rounded-full px-5 py-2 text-body-sm font-semibold border border-border-subtle bg-surface-raised hover:bg-surface-sunken text-fg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!text.trim() || saving || enriching}
            aria-label="Guardar cambios"
            className="focus-ring rounded-full px-5 py-2 bg-primary text-on-primary font-semibold text-body-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {saving ? "Guardando..." : "Guardar cambios ↵"}
          </button>
        </footer>
      </form>
    </div>
  );
}
