"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "@/components/icons";
import { getContentIndex, type ContentItem, type ContentType } from "@/lib/search/contentIndex";
import { searchContent } from "@/lib/search/searchContent";

const labels: Record<ContentType, string> = {
  lexicon: "Lexicon",
  lesson: "Mini lecciones",
  sound: "Sound Lab",
  route: "Rutas",
  reader: "Lecturas",
};

const suggestions = [
  { title: "Diccionario", description: "Explora vocabulario por tema.", path: "/dictionary" },
  { title: "Mini lecciones", description: "Una explicación breve para hoy.", path: "/mini-lessons" },
  { title: "Laboratorio de sonidos", description: "Escucha y practica sonidos.", path: "/practice/sounds" },
  { title: "Ruta de aprendizaje", description: "Continúa desde tu nivel.", path: "/courses" },
];

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const index = useMemo(() => getContentIndex(), []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebouncedQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const results = useMemo(
    () => searchContent(debouncedQuery, index).slice(0, 8),
    [debouncedQuery, index],
  );
  const grouped = useMemo(() => results.reduce<Record<string, ContentItem[]>>((groups, item) => {
    (groups[item.type] ??= []).push(item);
    return groups;
  }, {}), [results]);

  if (!open) return null;

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/35 px-4 pt-20 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}
      >
        <div className="flex items-center gap-3 border-b border-border-subtle px-4">
          <Search size={18} className="shrink-0 text-fg-muted" aria-hidden />
          <label id="global-search-title" className="sr-only">Buscar en English Journal</label>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca una lección, sonido o tema…" className="h-14 min-w-0 flex-1 bg-transparent text-body-md text-fg outline-none placeholder:text-fg-subtle" />
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-primary" aria-label="Cerrar búsqueda"><X size={18} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2 pr-1">
          {!debouncedQuery ? (
            <div className="p-2"><p className="px-2 pb-2 font-kicker text-fg-subtle">ACCESOS FRECUENTES</p>{suggestions.map((item) => <ResultButton key={item.path} item={item} onSelect={navigate} />)}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center"><p className="text-label text-fg">No encontramos resultados para “{debouncedQuery}”.</p><p className="mt-2 text-body-sm text-fg-muted">Prueba con otra palabra o vuelve a Explorar para recorrer el contenido.</p><button type="button" onClick={() => navigate("/courses")} className="mt-4 text-label text-primary underline underline-offset-4">Ir a Explorar</button></div>
          ) : Object.entries(grouped).map(([type, items]) => <div key={type} className="p-2"><p className="px-2 pb-2 font-kicker text-fg-subtle">{labels[type as ContentType].toUpperCase()}</p>{items.map((item) => <ResultButton key={item.id} item={item} onSelect={navigate} />)}</div>)}
        </div>
      </section>
    </div>
  );
}

function ResultButton({ item, onSelect }: { item: Pick<ContentItem, "title" | "description" | "path" | "cefr">; onSelect: (path: string) => void }) {
  return <button type="button" onClick={() => onSelect(item.path)} className="block w-full rounded-md px-2 py-2.5 text-left transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-primary"><span className="flex items-center gap-2 text-label text-fg">{item.title}{item.cefr ? <span className="font-kicker text-fg-subtle">{item.cefr}</span> : null}</span><span className="mt-0.5 block line-clamp-1 text-body-sm text-fg-muted">{item.description}</span></button>;
}
