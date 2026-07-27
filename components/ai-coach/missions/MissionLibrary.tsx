'use client'

import { useState } from 'react'
import type { MissionCategory, OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCategoryFilter } from './MissionCategoryFilter'
import { MissionCard } from './MissionCard'

// Planned structure:
// <MissionLibrary>
//   <MissionCategoryFilter />
//   <MissionCard /> — one per mission

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
    return <p className="m-0 text-body-sm text-fg-muted">No hay misiones disponibles todavía.</p>
  }

  return (
    <div className="space-y-3">
      <MissionCategoryFilter active={category} onChange={setCategory} />
      <div className="grid gap-3">
        {filteredMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
