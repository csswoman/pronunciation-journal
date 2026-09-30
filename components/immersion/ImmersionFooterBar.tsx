'use client';

// Planned structure:
// <ImmersionFooterBar>
//   <FooterContainer>
//     <ViewAllButton onClick={onToggleViewAll} />
//     <ExternalRegistrationHint />
//   </FooterContainer>
// </ImmersionFooterBar>

import Link from 'next/link';

interface ImmersionFooterBarProps {
  totalLessons?: number;
  onViewAllClick?: () => void;
  isExpanded?: boolean;
}

export function ImmersionFooterBar({
  totalLessons = 287,
  onViewAllClick,
  isExpanded = false,
}: ImmersionFooterBarProps) {
  return (
    <footer className="mt-4 flex flex-wrap items-center gap-3.5 pt-2 text-body-sm text-fg-muted">
      <button
        type="button"
        onClick={onViewAllClick}
        className="inline-flex items-center justify-center rounded-full border border-border-default bg-surface-raised px-5 py-2.5 text-body-sm font-semibold text-fg shadow-xs transition-colors hover:bg-surface-sunken cursor-pointer focus-ring min-h-[42px]"
      >
        {isExpanded ? 'Ver solo focos de la semana' : `Ver las ${totalLessons} lecciones`}
      </button>

      <span className="text-tiny sm:text-body-sm">
        También puedes registrar lo que veas fuera de la app desde tu{' '}
        <Link href="/daily" className="underline hover:text-fg transition-colors">
          plan de hoy
        </Link>
        .
      </span>
    </footer>
  );
}
