"use client";

import { useState } from "react";
import { ArticulationMouthGuide } from "@/components/pronunciation/ArticulationMouthGuide";
import { ChevronDown, ChevronUp } from "@/components/icons";

interface Props {
  phonemeA: string;
  phonemeB: string;
}

export function ContrastMouthComparison({ phonemeA, phonemeB }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-default bg-surface-raised p-3.5 my-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left font-label text-xs font-semibold text-primary hover:underline"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span>👄 ¿Cómo cambia la boca entre</span>
          <span className="font-ipa text-sm font-bold text-fg">{phonemeA}</span>
          <span>y</span>
          <span className="font-ipa text-sm font-bold text-fg">{phonemeB}</span>
          <span>?</span>
        </span>
        <span className="inline-flex items-center gap-1 text-fg-muted font-caption">
          {open ? "Ocultar" : "Ver comparación"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 mt-2 border-t border-border-subtle animate-in fade-in duration-200">
          <div>
            <span className="block mb-1.5 font-caption text-xs font-semibold text-fg-muted text-center uppercase tracking-wider">
              Sonido A
            </span>
            <ArticulationMouthGuide symbolOrIpa={phonemeA} compact />
          </div>
          <div>
            <span className="block mb-1.5 font-caption text-xs font-semibold text-fg-muted text-center uppercase tracking-wider">
              Sonido B
            </span>
            <ArticulationMouthGuide symbolOrIpa={phonemeB} compact />
          </div>
        </div>
      )}
    </div>
  );
}
