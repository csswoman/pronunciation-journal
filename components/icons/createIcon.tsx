import { forwardRef } from "react";
import type { LucideIcon as LucideIconComponent, LucideProps } from "lucide-react";

export type AppIconProps = LucideProps;

export type LucideIcon = LucideIconComponent;

/** Nav icons read best at a lighter stroke; button/inline icons stay closer to Lucide's default. */
const DEFAULT_STROKE_WIDTH = 1.8;

export function createIcon(Icon: LucideIconComponent, displayName: string): LucideIconComponent {
  const Wrapped = forwardRef<SVGSVGElement, AppIconProps>(function AppIcon(
    { strokeWidth, ...props },
    ref,
  ) {
    return (
      <Icon
        ref={ref}
        strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH}
        {...props}
      />
    );
  });
  Wrapped.displayName = displayName;
  return Wrapped as unknown as LucideIconComponent;
}
