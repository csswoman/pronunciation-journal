import { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Declared page frame: width + optional dashboard structure. */
export type PageArchetype = "dashboard" | "catalog" | "session";

interface PageLayoutProps {
  children: ReactNode;
  /**
   * Spatial contract for the route.
   * - dashboard: full canvas, optional banner + main + rail
   * - catalog: full canvas for grids/lists
   * - session: centered 720px column for focus work
   * @default "catalog"
   */
  archetype?: PageArchetype;
  /** Full-width strip above the dashboard columns (e.g. review due). */
  banner?: ReactNode;
  /** Sticky aside (17–22rem) for dashboard routes. */
  rail?: ReactNode;
  /** Accessible name for the rail landmark. */
  railLabel?: string;
  hero?: ReactNode;
  className?: string;
  /** @deprecated Prefer archetype="session". Keeps lesson chrome without page-shell gutters. */
  variant?: "default" | "lesson";
  /** @deprecated Ignored — open canvas is mandatory */
  cardWrapper?: boolean;
}

export default function PageLayout({
  children,
  archetype = "catalog",
  banner,
  rail,
  railLabel = "Complemento",
  hero,
  className = "",
  variant = "default",
}: PageLayoutProps) {
  if (variant === "lesson") {
    return (
      <div className={cn("page-shell page-shell--session", className)}>
        {hero}
        {children}
      </div>
    );
  }

  const shellClass = cn(
    "page-shell",
    archetype === "dashboard" && "page-shell--dashboard",
    archetype === "catalog" && "page-shell--catalog",
    archetype === "session" && "page-shell--session",
    className,
  );

  const useDashboardGrid = archetype === "dashboard" && (rail != null || banner != null);

  return (
    <div className={shellClass}>
      {hero}
      {useDashboardGrid ? (
        <div className="page-dashboard">
          {banner != null ? (
            <div className="page-dashboard__banner">{banner}</div>
          ) : null}
          <div className="page-dashboard__main">{children}</div>
          {rail != null ? (
            <aside className="page-dashboard__rail" aria-label={railLabel}>
              {rail}
            </aside>
          ) : null}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
