// Planned structure:
// <HomePrimaryAction>
//   <ActionLink />   — label + optional sublabel
// </HomePrimaryAction>

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PrimaryAction } from "@/lib/home/primary-action";

interface Props {
  action: PrimaryAction;
}

/**
 * The one destination on the home screen. Server-rendered so it is painted
 * on first frame — the previous layout resolved its hierarchy client-side,
 * which meant the learner saw competing cards before the plan settled.
 */
export default function HomePrimaryAction({ action }: Props) {
  const isPrimary = action.variant === "primary";

  return (
    <section aria-label="Acción principal" className="flex flex-col gap-2">
      <Link
        href={action.href}
        className={cn(
          "focus-ring flex w-full flex-col items-center justify-center gap-1 rounded-xl px-6 text-center transition-colors",
          isPrimary
            ? "bg-cta-bg py-[var(--layout-card-pad)] text-cta-fg hover:bg-cta-bg-hover"
            : "border border-border-default bg-surface-raised py-[var(--layout-stack-loose)] text-fg hover:bg-surface-sunken",
        )}
      >
        <span className={cn("font-semibold", isPrimary ? "text-body-lg" : "text-body-sm")}>
          {action.label}
        </span>
        {action.sublabel && (
          <span className="text-body-sm opacity-80">{action.sublabel}</span>
        )}
      </Link>
    </section>
  );
}
