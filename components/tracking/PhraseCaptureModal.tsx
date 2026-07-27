"use client";

import { useEffect, useRef } from "react";
import { CornerDownLeft, FileText, X } from "@/components/icons";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function PhraseCaptureModal({ open, value, onChange, onClose, onSubmit }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => { window.clearTimeout(timeout); window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose, open]);

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-[var(--layout-card-pad)]" style={{ background: "var(--overlay-medium)" }} onClick={onClose}>
    <form role="dialog" aria-modal="true" aria-labelledby="phrase-capture-title" onSubmit={(event) => { event.preventDefault(); onSubmit(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle layout-card-pad"><div className="flex gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary"><FileText size={18} aria-hidden /></span><div><p className="font-kicker text-fg-subtle">CAPTURA</p><h2 id="phrase-capture-title" className="mt-1 text-body-lg font-semibold text-fg">Guardar una frase</h2><p className="mt-1 text-body-sm text-fg-muted">Déjala aquí para volver a practicarla cuando quieras.</p></div></div><button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-[var(--radius-sm)] p-2 text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg"><X size={17} /></button></header>
      <div className="layout-card-pad"><label htmlFor="tracking-phrase" className="text-body-sm font-semibold text-fg">Frase en inglés</label><textarea ref={inputRef} id="tracking-phrase" value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onSubmit(); }} placeholder="I would like to sound more natural." rows={4} className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-3 text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]" /><p className="mt-2 text-caption text-fg-subtle">Consejo: guarda una frase completa, no una palabra aislada.</p></div>
      <footer className="flex flex-col-reverse gap-3 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-caption text-fg-subtle">⌘/Ctrl + Enter para guardar</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!value.trim()} icon={<CornerDownLeft size={14} />} iconPosition="right">Guardar frase</Button></div></footer>
    </form>
  </div>;
}
