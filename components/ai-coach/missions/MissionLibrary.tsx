'use client'

import { useCallback, useEffect, useState } from 'react'
import { isScriptedMission, type OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCategoryFilter } from './MissionCategoryFilter'
import { MissionCard } from './MissionCard'
import { MISSION_CATEGORY_LABELS, type MissionFilterCategory } from './mission-category-labels'
import { CreateMissionModal } from './CreateMissionModal'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { listGeneratedScripts } from '@/lib/ai-practice/missions/scripted/generated-store'
import Button from '@/components/ui/Button'
import { Sparkles } from '@/components/icons'

// Planned structure:
// <MissionLibrary>
//   <LibraryToolbar>
//     <FilterChrome /> — fixed category scroller
//     <CreateDialogAction /> — trigger for generating dialogues with AI
//   </LibraryToolbar>
//   <MissionList /> — scrollable cards or empty filter state
//   <CreateMissionModal /> — modal to generate and persist scripts
// </MissionLibrary>

interface MissionLibraryProps {
  missions: readonly OralMission[]
  onSelect: (missionId: string) => void
}

export default function MissionLibrary({ missions, onSelect }: MissionLibraryProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const [category, setCategory] = useState<MissionFilterCategory>('all')
  const [generatedMissions, setGeneratedMissions] = useState<OralMission[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadGenerated = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = await listGeneratedScripts(user.id)
      setGeneratedMissions(list)
    } catch {
      // Ignorar fallo de carga de Dexie
    }
  }, [user?.id])

  useEffect(() => {
    void loadGenerated()
  }, [loadGenerated])

  // Combinar misiones autoradas con generadas (evitando duplicados por ID)
  const allMissions = [
    ...generatedMissions,
    ...missions.filter((m) => !generatedMissions.some((g) => g.id === m.id)),
  ]

  const visibleMissions = category === 'all'
    ? allMissions
    : category === 'generated'
    ? allMissions.filter((m) => isScriptedMission(m) && m.origin === 'generated')
    : allMissions.filter((m) => m.category === category)

  const filteredMissions = visibleMissions

  return (
    <div className="@container flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border-subtle px-3 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-semibold text-fg">
            Práctica de diálogo
          </span>
          {user?.id && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<Sparkles size={15} />}
            >
              Crear con IA
            </Button>
          )}
        </div>
        <MissionCategoryFilter active={category} onChange={setCategory} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {filteredMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="m-0 text-pretty text-body-sm text-fg-muted">
              {category === 'generated'
                ? 'Aún no has generado diálogos personalizados.'
                : `No hay misiones en ${MISSION_CATEGORY_LABELS[category].toLowerCase()} todavía.`}
            </p>
            {category === 'generated' && user?.id && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  icon={<Sparkles size={15} />}
                >
                  Generar primer diálogo
                </Button>
              </div>
            )}
          </div>
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

      {user?.id && (
        <CreateMissionModal
          userId={user.id}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newMission) => {
            setGeneratedMissions((prev) => [newMission, ...prev])
            onSelect(newMission.id)
          }}
        />
      )}
    </div>
  )
}
