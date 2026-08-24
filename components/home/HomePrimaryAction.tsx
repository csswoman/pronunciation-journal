// Planned structure:
// <HomePrimaryAction>
//   <ActionLink />   — label + optional sublabel
// </HomePrimaryAction>

import Anchor from "@/components/ui/Anchor";
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
      <Anchor
        href={action.href}
        color="unstyled"
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-xl px-6 text-center no-underline",
          isPrimary
            ? "min-h-24 bg-cta-bg text-cta-fg hover:bg-cta-bg-hover"
            : "min-h-16 border border-border-default bg-surface-raised text-fg hover:bg-surface-sunken",
        )}
      >
        <span className={cn("font-semibold", isPrimary ? "text-body-lg" : "text-body-sm")}>
          {action.label}
        </span>
        {action.sublabel && (
          <span className="text-body-sm opacity-80">{action.sublabel}</span>
        )}
      </Anchor>
    </section>
  );
}
