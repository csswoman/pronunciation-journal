'use client'

// Planned structure:
// <DeckPagination>
//   <PageStatus />
//   <PagerActions>
//     <PrevButton />
//     <NextButton />
//   </PagerActions>
// </DeckPagination>

import Button from '@/components/ui/Button'

interface DeckPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function DeckPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: DeckPaginationProps) {
  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav
      className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginación de mazos"
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
