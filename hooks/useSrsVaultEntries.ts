'use client'

import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, migrateArchivedSrsRows } from '@/lib/db'
import { isVaultEntry } from '@/lib/srs/vault'
import { useAuth } from '@/components/auth/AuthProvider'

export function useSrsVaultEntries() {
  const { user } = useAuth()

  useEffect(() => {
    void migrateArchivedSrsRows(user?.id)
  }, [user?.id])

  const allEntries =
    useLiveQuery(
      () => (user?.id ? db.srsData.where('userId').equals(user.id).toArray() : []),
      [user?.id],
    ) ?? []

  return useMemo(() => allEntries.filter(isVaultEntry), [allEntries])
}
