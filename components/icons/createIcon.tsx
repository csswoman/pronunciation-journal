import { forwardRef } from "react";
import type { IconProps, TablerIcon } from "@tabler/icons-react";

/** Lucide-compatible props: accept `strokeWidth` and default stroke to 1. */
export type AppIconProps = IconProps & {
  strokeWidth?: string | number;
};

export type LucideIcon = TablerIcon;

const DEFAULT_STROKE = 1;

export function createIcon(Icon: TablerIcon, displayName: string): TablerIcon {
  const Wrapped = forwardRef<SVGSVGElement, AppIconProps>(function AppIcon(
    { stroke, strokeWidth, ...props },
    ref,
  ) {
    return (
      <Icon
        ref={ref}
        stroke={stroke ?? strokeWidth ?? DEFAULT_STROKE}
        {...props}
      />
    );
  });
  Wrapped.displayName = displayName;
  return Wrapped;
}
