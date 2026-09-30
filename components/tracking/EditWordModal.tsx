"use client";

// Planned structure:
// <EditWordModal>
//   <Backdrop />
//   <ModalContainer: Header(Icon + BricolageTitle + Subtitle + RoundCloseButton) />
//   <ModalForm: WordInput + AIEnrichButton + IPA + Translation + Meaning + Context />
//   <ModalFooter: NoticeText + CancelButton + SaveButton />
// </EditWordModal>

import { useEffect, useRef, useState } from "react";
import { Pencil, Sparkles, X } from "@/components/icons";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { WordDetailsUpdate } from "@/lib/word-bank/queries";

interface Props {
  word: WordBankEntry | null;
  onClose: () => void;
  onSubmit: (id: string, input: WordDetailsUpdate) => Promise<void>;
}

function asOptionalValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

export function EditWordModal({ word, onClose, onSubmit }: Props) {
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [ipa, setIpa] = useState("");
  const [translation, setTranslation] = useState("");
  const [meaning, setMeaning] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;
    setText(word.text);
    setIpa(word.ipa ?? "");
    setTranslation(word.translation ?? "");
    setMeaning(word.meaning ?? "");
    setContext(word.context ?? "");
    setSaving(false);
    setEnriching(false);
    setError(null);
    const timeout = window.setTimeout(() => wordInputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [word]);

  useEffect(() => {
    if (!word) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !enriching) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [enriching, onClose, saving, word]);

  if (!word) return null;

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
          kind: "word",
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
      };

      if (data.ipa) setIpa(data.ipa.replace(/^\/+|\/+$/g, ""));
      if (data.translation) setTranslation(data.translation);
      if (data.meaning) setMeaning(data.meaning);
      if (data.context && !context.trim()) setContext(data.context);
    } catch {
      setError("No pudimos enriquecer la palabra con IA. Inténtalo de nuevo.");
    } finally {
      setEnriching(false);
    }
  };

  const submit = async () => {
    const nextText = text.trim();
    if (!nextText || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(word.id, {
        text: nextText,
        ipa: asOptionalValue(ipa)?.replace(/^\/+|\/+$/g, "") ?? null,
        translation: asOptionalValue(translation),
        meaning: asOptionalValue(meaning),
        context: asOptionalValue(context),
      });
      onClose();
    } catch {
      setError("No pudimos actualizar la palabra. Inténtalo de nuevo.");
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
        aria-labelledby="edit-word-title"
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
              <Pencil size={18} aria-hidden />
            </span>
            <div>
              <span className="font-mono text-overline font-semibold uppercase tracking-wider text-fg-subtle">
                MIS PALABRAS
              </span>
              <h2 id="edit-word-title" className="font-display text-2xl font-bold text-fg mt-0.5">
                Editar palabra
              </h2>
              <p className="mt-1 text-body-sm text-fg-muted font-medium">
                Corrige o enriquece los detalles con IA para estudiar mejor.
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1">
              <label className="block text-body-sm font-bold text-fg mb-1.5">
                Palabra
              </label>
              <input
                ref={wordInputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
                className="w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-md font-medium text-fg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleEnrich()}
              disabled={!text.trim() || enriching || saving}
              className="focus-ring inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft px-4 text-body-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles size={16} className={enriching ? "animate-spin" : ""} />
              <span>{enriching ? "Enriqueciendo…" : "Enriquecer con IA"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-body-sm font-bold text-fg mb-1.5">
                IPA <span className="font-normal text-fg-subtle">(opcional)</span>
              </label>
              <input
                value={ipa}
                onChange={(event) => setIpa(event.target.value)}
                placeholder="rɪˈzɪliənt"
                className="font-ipa w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-body-sm font-bold text-fg mb-1.5">
                Traducción <span className="font-normal text-fg-subtle">(opcional)</span>
              </label>
              <input
                value={translation}
                onChange={(event) => setTranslation(event.target.value)}
                className="w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-bold text-fg mb-1.5">
              Significado en inglés <span className="font-normal text-fg-subtle">(opcional)</span>
            </label>
            <input
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-3 text-body-sm text-fg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-body-sm font-bold text-fg mb-1.5">
              Frase o contexto <span className="font-normal text-fg-subtle">(opcional)</span>
            </label>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              rows={3}
              placeholder="La frase real donde la escuchaste."
              className="w-full resize-none rounded-2xl border border-border-subtle bg-surface-sunken/80 p-3.5 text-body-sm text-fg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error ? (
            <p role="alert" className="text-body-sm text-error font-medium">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="mt-6 pt-4 border-t border-border-subtle flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-fg-subtle font-medium">
            La programación de repaso no cambia.
          </p>
          <div className="flex justify-end gap-2.5">
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
          </div>
        </footer>
      </form>
    </div>
  );
}
