import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Container: Responsive max-width wrapper with consistent horizontal padding
 * Provides consistent horizontal spacing and max-width constraints
 */
export default function Container({
  children,
  className = "",
  size = "full",
}: ContainerProps) {
  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-6xl",
  };

  return (
    <div
      className={`mx-auto ${maxWidths[size]} px-4 lg:px-6 ${className}`}
    >
      {children}
    </div>
  );
}
