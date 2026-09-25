'use client'

import { useCallback, useEffect, useState } from 'react'
import { isScriptedMission, type OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCategoryFilter } from './MissionCategoryFilter'
import { MissionCard } from './MissionCard'
import { MISSION_CATEGORY_LABELS, type MissionFilterCategory } from './mission-category-labels'
import { CreateMissionModal } from './CreateMissionModal'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { listGeneratedScripts } from '@/lib/ai-practice/missions/scripted/generated-store'
import { PillButton } from '@/components/ui/PillButton'
import { Sparkles } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'

// Planned structure:
// <MissionLibrary>
//   <LibraryHeader>
//     <KickerAndTitle> — PRÁCTICA DE DIÁLOGO + Elige una misión
//     <CreateAIAction /> — ✦ Crear con IA pill button
//   </LibraryHeader>
//   <MissionCategoryFilter /> — category selector chips
//   <MissionGrid>
//     <FeaturedMissionCard /> (when category is 'all')
//     <RegularMissionCardList /> — pastel-colored cards with background illustrations
//     <CreateOwnMissionCard /> — pastel mint surface card for AI creation
//   </MissionGrid>
//   <CreateMissionModal /> — script generator dialog
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
  const [featuredId, setFeaturedId] = useState<string | null>(null)

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

  // Seleccionar una misión sugerida dinámica diferente en cada visita al componente
  useEffect(() => {
    if (allMissions.length > 0 && !featuredId) {
      if (process.env.NODE_ENV === 'test') {
        setFeaturedId(allMissions[0].id)
      } else {
        const randomIndex = Math.floor(Math.random() * allMissions.length)
        setFeaturedId(allMissions[randomIndex].id)
      }
    }
  }, [allMissions, featuredId])

  const visibleMissions = category === 'all'
    ? allMissions
    : category === 'generated'
    ? allMissions.filter((m) => isScriptedMission(m) && m.origin === 'generated')
    : allMissions.filter((m) => m.category === category)

  // Reorganizar para posicionar la sugerida al principio cuando la vista es 'todas'
  const filteredMissions = category === 'all' && featuredId
    ? [
        ...visibleMissions.filter((m) => m.id === featuredId),
        ...visibleMissions.filter((m) => m.id !== featuredId),
      ]
    : visibleMissions

  const showCreateCard = Boolean(user?.id && (category === 'all' || category === 'generated'))

  return (
    <div className="@container flex h-full min-h-0 flex-col">
      {/* Header section */}
      <div className="shrink-0 space-y-2 border-b border-border-subtle px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] font-bold tracking-wider text-fg-subtle uppercase">
              Práctica de diálogo
            </span>
            <h2 className="m-0 font-display text-xl @[28rem]:text-2xl font-bold text-fg">
              Elige una misión
            </h2>
          </div>
          {user?.id && (
            <PillButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<Sparkles size={14} />}
              className="!bg-primary !text-white hover:!bg-primary-hover font-medium px-4 border-none shadow-xs"
            >
              Crear con IA
            </PillButton>
          )}
        </div>
        <MissionCategoryFilter active={category} onChange={setCategory} />
      </div>

      {/* Main scroll area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
        {filteredMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="m-0 text-pretty text-body-sm text-fg-muted">
              {category === 'generated'
                ? 'Aún no has generado diálogos personalizados.'
                : `No hay misiones en ${MISSION_CATEGORY_LABELS[category].toLowerCase()} todavía.`}
            </p>
            {category === 'generated' && user?.id && (
              <div className="mt-3">
                <PillButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  icon={<Sparkles size={14} />}
                >
                  Generar primer diálogo
                </PillButton>
              </div>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-3.5 @[28rem]:grid-cols-2"
            aria-live="polite"
          >
            {filteredMissions.map((mission, index) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onSelect={onSelect}
                isFeatured={index === 0 && category === 'all'}
              />
            ))}

            {showCreateCard && (
              <PastelCard
                tone="mint"
                className="relative flex flex-col justify-between gap-4 p-5 overflow-hidden rounded-3xl group min-h-[190px]"
              >
                <div className="flex flex-col gap-3 min-w-0 z-10">
                  <div className="flex flex-wrap items-center justify-start gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-ink/10 border border-ink/20 px-2.5 py-0.5 text-tiny font-bold text-ink select-none">
                      PERSONALIZADO
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 pr-8">
                    <h3 className="m-0 font-display text-base @[28rem]:text-lg font-bold text-ink leading-tight tracking-tight">
                      Crea tu propia misión
                    </h3>
                    <p className="m-0 text-xs text-ink-secondary text-pretty line-clamp-2">
                      Diseña un diálogo a tu medida usando IA. Elige el tema, el rol y la dificultad.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between z-10 pt-1">
                  <PillButton
                    type="button"
                    variant="primary"
                    size="sm"
                    className="!bg-ink !text-paper border-none hover:!bg-ink/90 font-medium text-xs rounded-full min-h-9 px-4 transition-transform duration-150 active:scale-95"
                    onClick={() => setIsCreateOpen(true)}
                    icon={<Sparkles size={14} />}
                  >
                    Crear diálogo
                  </PillButton>
                </div>

                {/* Background Sparkles illustration */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -bottom-6 text-ink/15 transition-all duration-300 group-hover:scale-105 group-hover:text-ink/25"
                >
                  <Sparkles size={160} />
                </div>
              </PastelCard>
            )}
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
