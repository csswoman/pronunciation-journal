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
    sm: "layout-stack-tight",
    md: "layout-stack",
    lg: "layout-stack-loose",
    xl: "layout-section-gap",
  };

  return (
    <section className={className}>
      {title && (
        <div className="mb-[var(--layout-stack-loose)]">
          <H2
            className={`${titleSize === "h4" ? "text-h4" : titleSize === "h3" ? "text-h3" : "text-h2"} mb-[var(--layout-stack-tight)]`}
          >
            {title}
          </H2>
          {description && (
            <p className="text-body-md text-pretty text-fg-muted">
              {description}
            </p>
          )}
        </div>
      )}

      <div className={spacingMap[spacing]}>
        {children}
      </div>
    </section>
  );
}
