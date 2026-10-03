import { cn } from "@/lib/cn";
import type { NavItem, NavTone } from "./NavLink";

interface NavIconPillProps {
  icon: NavItem["icon"];
  tone?: NavTone;
  className?: string;
}

/**
 * Rounded pastel chip behind a nav icon. Reuses the `.pastel-card` theming
 * scope so the glyph stays ink-dark on the fill in both light and dark mode.
 * Without a tone it falls back to a neutral raised surface.
 */
export function NavIconPill({ icon: Icon, tone, className }: NavIconPillProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-sm",
        tone ? "pastel-card" : "bg-surface-sunken text-fg-subtle",
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden />
    </span>
  );
}
