import { ReactNode, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type PastelTone = "sky" | "butter" | "coral" | "lilac" | "mint" | "accent";

interface PastelCardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  tone: PastelTone;
}

/**
 * A pastel-filled card. Sets its own theming scope (see .pastel-card in
 * utilities.css) so neutral text/border tokens resolve to ink variants
 * instead of the low-contrast values tuned for --surface-raised.
 */
export default function PastelCard({
  children,
  tone,
  className,
  ...rest
}: PastelCardProps) {
  return (
    <div
      data-tone={tone}
      className={cn("pastel-card rounded-3xl p-6", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
