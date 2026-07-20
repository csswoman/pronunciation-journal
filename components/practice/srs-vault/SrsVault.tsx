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
import { useAuth } from '@/components/auth/AuthProvider'

export function SrsVault() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    void migrateArchivedSrsRows(user?.id)
  }, [user?.id])

  const allEntries = useLiveQuery(() => user?.id ? db.srsData.where('userId').equals(user.id).toArray() : [], [user?.id]) ?? []

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
