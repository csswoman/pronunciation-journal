import { ReactNode } from "react";

interface GridProps {
  children: ReactNode;
  className?: string;
  cols?: "1" | "2" | "3" | "4" | "6" | "12";
  gap?: "sm" | "md" | "lg";
  responsive?: boolean;
}

/**
 * Grid: Responsive grid layout with consistent gap spacing
 * Default: responsive (1 column mobile, 2 tablet, 3 desktop)
 */
export default function Grid({
  children,
  className = "",
  cols = "3",
  gap = "md",
  responsive = true,
}: GridProps) {
  const colMap = {
    "1": "grid-cols-1",
    "2": "grid-cols-2",
    "3": "grid-cols-3",
    "4": "grid-cols-4",
    "6": "grid-cols-6",
    "12": "grid-cols-12",
  };

  const gapMap = {
    sm: "gap-3",  // 12px
    md: "gap-4",  // 16px
    lg: "gap-6",  // 24px
  };

  // Responsive variant: mobile → tablet → desktop
  const responsiveClasses = responsive
    ? `grid-cols-1 md:grid-cols-2 lg:${colMap[cols]}`
    : colMap[cols];

  return (
    <div className={`grid ${responsiveClasses} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  );
}
