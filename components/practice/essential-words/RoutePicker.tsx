'use client'

// Planned structure:
// <RoutePicker>
//   header
//   <RoutePickerOption recommended />
//   <RouteLevelGroup /> × n
// </RoutePicker>

import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { fetchEssentialWords } from '@/lib/essential-words/client'
import {
  formatRouteProgressCopy,
  routeWordIdsFromWords,
  tallyRouteProgress,
} from '@/lib/essential-words/route-stats'
import {
  getRoute,
  groupRoutesByLevel,
  routeShortLabel,
  wordsInRoute,
  type VocabularyRoute,
} from '@/lib/essential-words/routes'
import { ESSENTIAL_WORD_PREFIX, type EssentialWord } from '@/lib/essential-words/types'
import { useAuth } from '@/components/auth/AuthProvider'
import type { SRSData } from '@/lib/types'
import { RoutePickerOption } from './RoutePickerOption'

interface Props {
  value: string | null
  onChange: (routeId: string | null) => void
  disabled?: boolean
}

function buildSrsMap(entries: readonly SRSData[]): Map<string, SRSData> {
  return new Map(entries.map((entry) => [entry.wordId, entry]))
}

function routeMeta(route: VocabularyRoute, words: EssentialWord[], srsByWordId: Map<string, SRSData>) {
  const routeWords = wordsInRoute(words, route)
  const progress = tallyRouteProgress(routeWordIdsFromWords(routeWords), srsByWordId)
  return formatRouteProgressCopy(progress) || 'Sin palabras en esta ruta'
}

export function RoutePicker({ value, onChange, disabled }: Props) {
  const { user } = useAuth()
  const [words, setWords] = useState<EssentialWord[] | null>(null)

  const srsEntries =
    useLiveQuery(
      () =>
        user?.id
          ? db.srsData
              .filter(
                (entry) =>
                  entry.userId === user.id && entry.wordId.startsWith(ESSENTIAL_WORD_PREFIX),
              )
              .toArray()
          : [],
      [user?.id],
    ) ?? []

  useEffect(() => {
    let cancelled = false
    fetchEssentialWords()
      .then((nextWords) => {
        if (!cancelled) setWords(nextWords)
      })
      .catch(() => {
        /* wait for data */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const srsByWordId = useMemo(() => buildSrsMap(srsEntries), [srsEntries])
  const levelGroups = useMemo(() => groupRoutesByLevel(), [])
  const activeRoute = getRoute(value)
  const loading = !words

  return (
    <div
      role="radiogroup"
      aria-label="De dónde salen las palabras nuevas"
      className="flex w-full flex-col gap-4 text-left"
    >
      <header className="flex flex-col gap-1">
        <h3 className="m-0 font-label text-fg">De dónde salen las palabras nuevas</h3>
        <p className="m-0 text-caption text-pretty text-fg-muted">
          Los repasos vencidos entran siempre, elijas lo que elijas
        </p>
      </header>

      <RoutePickerOption
        recommended
        selected={value === null}
        title="Recomendada"
        description="Sigue el orden de frecuencia"
        onSelect={() => {
          if (!disabled) onChange(null)
        }}
      />

      {loading ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <div className="h-10 w-20 animate-pulse rounded bg-surface-sunken" />
          <div className="h-11 animate-pulse rounded-lg bg-surface-sunken" />
          <div className="h-11 animate-pulse rounded-lg bg-surface-sunken" />
        </div>
      ) : (
        levelGroups.map((group) => (
          <section key={group.level} className="flex flex-col gap-2">
            <h4 className="m-0 font-kicker text-fg-subtle">Nivel {group.level}</h4>
            <div className="flex flex-col gap-2">
              {group.routes.map((route) => (
                <RoutePickerOption
                  key={route.id}
                  selected={value === route.id}
                  title={routeShortLabel(route)}
                  meta={routeMeta(route, words, srsByWordId)}
                  ariaLabel={`${routeShortLabel(route)} · Nivel ${group.level}`}
                  onSelect={() => {
                    if (!disabled) onChange(route.id)
                  }}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {activeRoute && !loading ? (
        <p className="m-0 text-caption text-fg-muted">{activeRoute.description}</p>
      ) : null}
    </div>
  )
}
