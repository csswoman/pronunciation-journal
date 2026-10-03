// Planned structure:
// <GuestProgressCard>
//   <avatar chip />  <title + hint />  <settingsSlot />
//   <Guardar progreso CTA />
// </GuestProgressCard>

import type { ReactNode } from "react";
import { LogIn, User } from "@/components/icons";

interface GuestProgressCardProps {
  onSave: () => void;
  settingsSlot?: ReactNode;
}

export function GuestProgressCard({ onSave, settingsSlot }: GuestProgressCardProps) {
  return (
    <div data-tone="lilac" className="pastel-card space-y-3 rounded-[28px] p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/40 text-fg">
          <User size={22} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 font-sans text-base font-bold leading-tight text-fg">
          Modo invitado
        </p>
      </div>
      <p className="px-1 font-sans text-sm leading-snug text-fg-muted">
        Guarda tu progreso para no perderlo
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="focus-ring press-feedback flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 font-sans text-sm font-bold transition-opacity hover:opacity-90"
        >
          <LogIn size={18} aria-hidden className="shrink-0" />
          <span className="truncate">Guardar progreso</span>
        </button>
        {settingsSlot && (
          <span className="shrink-0 [&>button]:size-12 [&>button]:rounded-full [&>button]:bg-ink [&>button]:text-white [&>button:hover]:bg-ink [&>button:hover]:text-white">
            {settingsSlot}
          </span>
        )}
      </div>
    </div>
  );
}
