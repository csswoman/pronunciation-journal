// Planned structure:
// <HomeExploreDrawer>
//   <summary>  — the disclosure trigger
//   {children} — every secondary home surface
// </HomeExploreDrawer>

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Collapses every non-primary home surface behind one disclosure.
 *
 * A native <details> on purpose: no client JS, keyboard-accessible for free,
 * and the content stays in the DOM so links still prefetch.
 */
export default function HomeExploreDrawer({ children }: Props) {
  return (
    <details className="group mt-[var(--layout-section-gap)] border-t border-border-subtle pt-[var(--layout-stack-loose)]">
      <summary className="focus-ring cursor-pointer list-none font-body-sm font-medium text-fg-muted marker:content-none hover:text-fg">
        Explorar
        <span aria-hidden="true" className="ml-1 inline-block transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </details>
  );
}
