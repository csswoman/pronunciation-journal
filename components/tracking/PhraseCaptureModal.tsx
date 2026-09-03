"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, FileText, X } from "@/components/icons";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  context: string;
  onContextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

export function PhraseCaptureModal({ open, value, onChange, context, onContextChange, onClose, onSubmit }: Props) {
  const modalRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const requestClose = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = async () => {
    if (!value.trim() || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSubmit();
    } catch {
      setSaveError("No pudimos guardar la frase. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setIsSaving(false);
    setSaveError(null);
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose, open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-[var(--layout-card-pad)] bg-black/50 backdrop-blur-sm" onClick={requestClose}>
    <form ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="phrase-capture-title" onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle layout-card-pad"><div className="flex gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><FileText size={18} aria-hidden /></span><div><p className="font-kicker text-fg-subtle">TRACKING</p><h2 id="phrase-capture-title" className="mt-1 text-h3 text-fg">Guardar una frase</h2><p className="mt-1 text-body-sm text-fg-muted">Guarda exactamente lo que escuchaste, aunque no esté ligada a una palabra.</p></div></div><button type="button" onClick={requestClose} disabled={isSaving} aria-label="Cerrar" className="rounded-[var(--radius-sm)] p-2 text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg"><X size={17} /></button></header>
      <div className="grid gap-[var(--layout-stack)] layout-card-pad md:grid-cols-[minmax(0,1fr)_14rem]"><div className="space-y-4"><div><label htmlFor="tracking-phrase" className="text-body-sm font-semibold text-fg">Frase en inglés</label><textarea ref={inputRef} id="tracking-phrase" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void handleSubmit(); }} placeholder="I would like to sound more natural." rows={5} className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-3 text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></div><div><label htmlFor="tracking-phrase-context" className="text-body-sm font-semibold text-fg">Dónde la escuchaste <span className="font-normal text-fg-subtle">(opcional)</span></label><input id="tracking-phrase-context" value={context} onChange={(event) => onContextChange(event.target.value)} placeholder="Serie, clase o situación" className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-2.5 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /></div>{saveError ? <p role="alert" className="text-body-sm text-error">{saveError}</p> : null}</div><aside className="rounded-md bg-surface-sunken p-3"><p className="font-kicker text-fg-subtle">CAPTURA LIBRE</p><p className="mt-2 text-body-sm text-fg-muted">No se convierte en el ejemplo de una palabra. La frase queda guardada tal como la anotaste.</p></aside></div>
      <footer className="flex flex-col-reverse gap-3 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-caption text-fg-subtle">⌘/Ctrl + Enter para guardar</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={requestClose} disabled={isSaving}>Cancelar</Button><Button type="submit" disabled={!value.trim() || isSaving} isLoading={isSaving} icon={<CornerDownLeft size={14} />} iconPosition="right">Guardar frase</Button></div></footer>
    </form>
  </div>;
}
