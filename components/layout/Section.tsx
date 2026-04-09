import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg" | "xl";
  title?: string;
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
          <h2 className="text-2xl font-bold tracking-tight text-[var(--deep-text)] mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-base text-[var(--text-secondary)]">
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
