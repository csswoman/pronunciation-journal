'use client'

// Planned structure:
// <SrsVault>
//   <SrsVaultTrigger count onOpen />
//   <SrsVaultModal open onClose entries>
// </SrsVault>

import { useState } from 'react'
import { SrsVaultModal } from './SrsVaultModal'
import { SrsVaultTrigger } from './SrsVaultTrigger'
import { useSrsVaultEntries } from '@/hooks/useSrsVaultEntries'

export function SrsVault() {
  const [open, setOpen] = useState(false)
  const vaultEntries = useSrsVaultEntries()

  return (
    <>
      <SrsVaultTrigger count={vaultEntries.length} onOpen={() => setOpen(true)} />
      <SrsVaultModal
        open={open}
        onClose={() => setOpen(false)}
        entries={vaultEntries}
      />
    </>
  )
}
