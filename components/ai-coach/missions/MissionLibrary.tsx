'use client'

import type { OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCard } from './MissionCard'

// Planned structure:
// <MissionLibrary>
//   <MissionCard /> — one per mission

interface MissionLibraryProps {
  missions: readonly OralMission[]
  onSelect: (missionId: string) => void
}

export default function MissionLibrary({ missions, onSelect }: MissionLibraryProps) {
  if (missions.length === 0) {
    return <p className="m-0 text-body-sm text-fg-muted">No hay misiones disponibles todavía.</p>
  }

  return (
    <div className="grid gap-3">
      {missions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} onSelect={onSelect} />
      ))}
    </div>
  )
}
