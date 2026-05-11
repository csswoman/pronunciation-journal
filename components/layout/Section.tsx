import { ReactNode } from "react";
import { H2 } from "@/components/ui/Typography";

interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
  title?: string;
  titleSize?: "h2" | "h3" | "h4";
  description?: string;
}

/**
 * Section: Vertical spacing wrapper for content sections
 * Ensures consistent spacing between sections throughout the page
 */
export default function Section({
  children,
  className = "",
  spacing = "lg",
  title,
  titleSize = "h2",
  description,
}: SectionProps) {
  const spacingMap = {
    sm: "space-y-3",   // 12px → 8px + 4px
    md: "space-y-4",   // 16px
    lg: "space-y-6",   // 24px
    xl: "space-y-8",   // 32px
  };

  return (
    <section className={`${className}`}>
      {/* Optional header */}
      {title && (
        <div className="mb-6">
          <H2 className={`${titleSize === "h4" ? "text-h4 tracking-[-0.01em]" : titleSize === "h3" ? "text-h3" : "text-h2"} mb-2`}>
            {title}
          </H2>
          {description && (
            <p className="text-base text-fg-muted">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Content with spacing */}
      <div className={spacingMap[spacing]}>
        {children}
      </div>
    </section>
  );
}
