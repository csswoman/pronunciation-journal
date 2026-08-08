"use client";

import Link from "next/link";
import { LogIn } from "@/components/icons";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";

/**
 * Empty / no-session surface for Progress & Review.
 * Prefer GuestSaveProgressBanner when an anonymous session already exists.
 */
export function GuestBanner() {
  return (
    <div className="flex flex-col gap-4">
      <GuestSaveProgressBanner variant="emphasized" />

      <section
        className="flex flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised px-4 py-8 text-center sm:px-6"
        aria-labelledby="guest-banner-title"
      >
        <div className="grid size-12 place-items-center rounded-lg bg-primary-soft text-primary">
          <LogIn size={22} aria-hidden />
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <h2 id="guest-banner-title" className="font-label text-h4 font-semibold text-fg text-balance">
            Inicia sesión para ver tu seguimiento
          </h2>
          <p className="font-body-sm text-pretty text-fg-muted">
            Rachas, precisión semanal y el perfil de habilidades aparecen cuando hay una
            cuenta o una sesión de práctica guardada.
          </p>
        </div>
        <Link
          href="/login?intent=save"
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary transition-colors hover:bg-primary-hover"
        >
          <LogIn size={16} aria-hidden />
          Iniciar sesión
        </Link>
      </section>
    </div>
  );
}
