// Planned structure:
// <GuestSaveProgressBanner>
//   title + body
//   primary → crear cuenta · secondary → iniciar sesión
// </GuestSaveProgressBanner>

import Link from "next/link";
import { cn } from "@/lib/cn";

export type GuestSaveProgressVariant = "inline" | "default" | "emphasized";

interface GuestSaveProgressBannerProps {
  variant?: GuestSaveProgressVariant;
  className?: string;
}

/**
 * Evident save-progress cue for anonymous guests.
 * inline — quiet under first-practice activation (does not steal primary CTA)
 * default — full strip on Home
 * emphasized — after real practice progress
 */
export default function GuestSaveProgressBanner({
  variant = "default",
  className,
}: GuestSaveProgressBannerProps) {
  if (variant === "inline") {
    return (
      <p
        className={cn("font-body-sm text-pretty text-fg-muted", className)}
        data-variant="inline"
      >
        Exploras sin cuenta permanente.{" "}
        <Link
          href="/login?intent=save&mode=register"
          className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
        >
          Crea una cuenta
        </Link>{" "}
        o{" "}
        <Link
          href="/login?intent=save"
          className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
        >
          inicia sesión
        </Link>{" "}
        para guardar el progreso.
      </p>
    );
  }

  const emphasized = variant === "emphasized";

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
        emphasized
          ? "border-primary/30 bg-primary-soft"
          : "border-border-subtle bg-surface-raised",
        className,
      )}
      aria-labelledby="guest-save-progress-title"
      data-variant={variant}
    >
      <div className="min-w-0 flex flex-col gap-1">
        <h2
          id="guest-save-progress-title"
          className="font-label font-semibold text-balance text-fg"
        >
          {emphasized
            ? "Ya practicaste — guarda este progreso"
            : "Estás explorando sin cuenta"}
        </h2>
        <p className="font-body-sm max-w-[60ch] text-pretty text-fg-muted">
          {emphasized
            ? "Si cambias de dispositivo o borras los datos del navegador, puedes perder lo de esta sesión. Una cuenta lo conserva."
            : "Puedes practicar y explorar con libertad. Crea una cuenta o inicia sesión cuando quieras conservar rachas, plan y resultados."}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href="/login?intent=save&mode=register"
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-label text-on-primary transition-colors hover:bg-primary-hover"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login?intent=save"
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border-default bg-transparent px-4 font-label text-fg transition-colors hover:bg-surface-sunken"
        >
          Iniciar sesión
        </Link>
      </div>
    </section>
  );
}
