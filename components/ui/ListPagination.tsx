'use client'

// Planned structure:
// <ListPagination>
//   <PageStatus />
//   <PagerActions>
//     <PrevButton />
//     <NextButton />
//   </PagerActions>
// </ListPagination>

import Button from '@/components/ui/Button'

interface ListPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  ariaLabel?: string
}

export function ListPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  ariaLabel = 'Paginación',
}: ListPaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav
      className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      <p className="text-body-sm text-fg-muted tabular-nums">
        <span className="font-semibold text-fg">{from}–{to}</span>
        {' '}de {totalItems}
        <span className="text-fg-subtle"> · Página {currentPage} de {totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
