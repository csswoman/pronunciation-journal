'use client'

import { useState } from 'react'
import type { MissionCategory, OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCategoryFilter } from './MissionCategoryFilter'
import { MissionCard } from './MissionCard'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'

// Planned structure:
// <MissionLibrary>
//   <FilterChrome /> — fixed category scroller
//   <MissionList /> — scrollable cards or empty filter state
// </MissionLibrary>

interface MissionLibraryProps {
  missions: readonly OralMission[]
  onSelect: (missionId: string) => void
}

export default function MissionLibrary({ missions, onSelect }: MissionLibraryProps) {
  const [category, setCategory] = useState<MissionCategory | 'all'>('all')
  const filteredMissions = category === 'all'
    ? missions
    : missions.filter((mission) => mission.category === category)

  if (missions.length === 0) {
    return (
      <p className="m-0 px-3 py-4 text-body-sm text-fg-muted">
        No hay misiones disponibles todavía.
      </p>
    )
  }

  return (
    <div className="@container flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border-subtle px-3 pb-3 pt-3">
        <MissionCategoryFilter active={category} onChange={setCategory} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {filteredMissions.length === 0 ? (
          <p className="m-0 text-pretty text-body-sm text-fg-muted">
            No hay misiones en {MISSION_CATEGORY_LABELS[category].toLowerCase()} todavía.
          </p>
        ) : (
          <div
            className="grid grid-cols-1 gap-3 @[28rem]:grid-cols-2 @[28rem]:gap-4"
            aria-live="polite"
          >
            {filteredMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
