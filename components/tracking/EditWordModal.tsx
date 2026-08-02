"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Pencil, X } from "@/components/icons";
import Button from "@/components/ui/Button";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;
    setText(word.text);
    setIpa(word.ipa ?? "");
    setTranslation(word.translation ?? "");
    setMeaning(word.meaning ?? "");
    setContext(word.context ?? "");
    setSaving(false);
    setError(null);
    const timeout = window.setTimeout(() => wordInputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [word]);

  useEffect(() => {
    if (!word) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving, word]);

  if (!word) return null;

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

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-[var(--layout-card-pad)]" style={{ background: "var(--overlay-medium)" }} onClick={() => !saving && onClose()}>
    <form role="dialog" aria-modal="true" aria-labelledby="edit-word-title" onSubmit={(event) => { event.preventDefault(); void submit(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle layout-card-pad"><div className="flex gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><Pencil size={18} aria-hidden /></span><div><p className="font-kicker text-fg-subtle">MIS PALABRAS</p><h2 id="edit-word-title" className="mt-1 text-h3 text-fg">Editar palabra</h2><p className="mt-1 text-body-sm text-fg-muted">Corrige los detalles que quieres conservar para estudiar.</p></div></div><button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar" className="min-h-11 min-w-11 rounded-[var(--radius-sm)] p-2 text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg"><X size={17} /></button></header>
      <div className="grid gap-4 layout-card-pad sm:grid-cols-2"><label className="text-body-sm font-semibold text-fg">Palabra<input ref={wordInputRef} value={text} onChange={(event) => setText(event.target.value)} required className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 text-fg outline-none transition-[border-color,box-shadow] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></label><label className="text-body-sm font-semibold text-fg">IPA <span className="font-normal text-fg-subtle">(opcional)</span><input value={ipa} onChange={(event) => setIpa(event.target.value)} placeholder="rɪˈzɪliənt" className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 font-ipa text-fg outline-none transition-[border-color,box-shadow] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></label><label className="text-body-sm font-semibold text-fg">Traducción <span className="font-normal text-fg-subtle">(opcional)</span><input value={translation} onChange={(event) => setTranslation(event.target.value)} className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 text-fg outline-none transition-[border-color,box-shadow] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></label><label className="text-body-sm font-semibold text-fg">Significado <span className="font-normal text-fg-subtle">(opcional)</span><input value={meaning} onChange={(event) => setMeaning(event.target.value)} className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 text-fg outline-none transition-[border-color,box-shadow] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></label><label className="sm:col-span-2 text-body-sm font-semibold text-fg">Frase o contexto <span className="font-normal text-fg-subtle">(opcional)</span><textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} placeholder="La frase real donde la escuchaste." className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 text-fg outline-none transition-[border-color,box-shadow] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></label>{error ? <p role="alert" className="sm:col-span-2 text-body-sm text-error">{error}</p> : null}</div>
      <footer className="flex flex-col-reverse gap-3 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-caption text-fg-subtle">La programación de repaso no cambia.</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button><Button type="submit" disabled={!text.trim() || saving} isLoading={saving} icon={<CornerDownLeft size={14} />} iconPosition="right">Guardar cambios</Button></div></footer>
    </form>
  </div>;
}
