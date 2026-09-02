// Planned structure:
// <GuestSaveProgressBanner>
//   title + body
//   primary → crear cuenta · secondary → iniciar sesión
// </GuestSaveProgressBanner>

import Link from "next/link";
import { cn } from "@/lib/cn";

export type GuestSaveProgressVariant = "inline" | "footer" | "default" | "emphasized";

interface GuestSaveProgressBannerProps {
  variant?: GuestSaveProgressVariant;
  className?: string;
}

/**
 * Evident save-progress cue for anonymous guests.
 * inline — quiet under first-practice activation (does not steal primary CTA)
 * default — full strip on Home
 * emphasized — after real practice progress (owns more of the fold)
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

  if (variant === "footer") {
    return (
      <section
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 font-body-sm text-fg-muted",
          className,
        )}
        aria-label="Guardar progreso"
        data-variant="footer"
      >
        <span>¿Quieres conservar lo de hoy?</span>
        <Link
          href="/login?intent=save&mode=register"
          className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
        >
          Crea una cuenta
        </Link>
        <span aria-hidden>o</span>
        <Link
          href="/login?intent=save"
          className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
        >
          inicia sesión
        </Link>
      </section>
    );
  }

  const emphasized = variant === "emphasized";

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border",
        emphasized
          ? "gap-5 border-primary/30 bg-primary-soft px-5 py-6 sm:gap-6 sm:px-6 sm:py-7"
          : "gap-4 border-border-subtle bg-surface-raised px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5 sm:py-5",
        className,
      )}
      aria-labelledby="guest-save-progress-title"
      data-variant={variant}
    >
      <div className={cn("min-w-0 flex flex-col", emphasized ? "gap-2" : "gap-1")}>
        <h2
          id="guest-save-progress-title"
          className={cn(
            "text-balance text-fg",
            emphasized
              ? "text-h3 font-bold tracking-tight"
              : "font-label font-semibold",
          )}
        >
          {emphasized
            ? "Ya practicaste — guarda este progreso"
            : "Estás explorando sin cuenta"}
        </h2>
        <p
          className={cn(
            "max-w-[60ch] text-pretty text-fg-muted",
            emphasized ? "font-body" : "font-body-sm",
          )}
        >
          {emphasized
            ? "Si cambias de dispositivo o borras los datos del navegador, puedes perder lo de esta sesión. Una cuenta lo conserva."
            : "Puedes practicar y explorar con libertad. Crea una cuenta o inicia sesión cuando quieras conservar rachas, plan y resultados."}
        </p>
      </div>

      <div
        className={cn(
          "flex shrink-0",
          emphasized
            ? "flex-col gap-3 sm:flex-row sm:items-stretch"
            : "flex-col gap-2 sm:flex-row sm:items-center",
        )}
      >
        <Link
          href="/login?intent=save&mode=register"
          className={cn(
            "focus-ring inline-flex items-center justify-center rounded-md font-label transition-colors",
            emphasized
              ? "min-h-12 px-5 bg-primary text-on-primary hover:bg-primary-hover"
              : "min-h-11 px-4 border border-border-default bg-surface text-fg hover:bg-surface-sunken",
          )}
        >
          Crear cuenta
        </Link>
        <Link
          href="/login?intent=save"
          className={cn(
            "focus-ring inline-flex items-center justify-center rounded-md border border-border-subtle bg-transparent font-label text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg",
            emphasized ? "min-h-12 px-5" : "min-h-11 px-4",
          )}
        >
          Iniciar sesión
        </Link>
      </div>
    </section>
  );
}
