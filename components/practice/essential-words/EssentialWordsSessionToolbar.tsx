'use client'

// Planned structure:
// <EssentialWordsSessionToolbar>
//   <SrsVault />
// </EssentialWordsSessionToolbar>

import { SrsVault } from '@/components/practice/srs-vault/SrsVault'

export function EssentialWordsSessionToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <SrsVault />
    </div>
  )
}
