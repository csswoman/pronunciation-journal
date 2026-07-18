'use client'

// Planned structure:
// <SrsVaultTrigger count onOpen />
// <SrsVaultModal open onClose entries>
//   <SrsVaultFilters />
//   <SrsVaultRow />*
// </SrsVaultModal>

import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, migrateArchivedSrsRows } from '@/lib/db'
import { isVaultEntry } from '@/lib/srs/vault'
import { SrsVaultModal } from './SrsVaultModal'
import { SrsVaultTrigger } from './SrsVaultTrigger'

export function SrsVault() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    void migrateArchivedSrsRows()
  }, [])

  const allEntries = useLiveQuery(() => db.srsData.toArray(), []) ?? []

  const vaultEntries = useMemo(
    () => allEntries.filter(isVaultEntry),
    [allEntries],
  )

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
