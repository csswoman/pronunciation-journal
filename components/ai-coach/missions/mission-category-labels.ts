import type { MissionCategory } from '@/lib/ai-practice/missions/types'

export type MissionFilterCategory = MissionCategory | 'all' | 'generated'

export const MISSION_CATEGORY_LABELS: Record<MissionFilterCategory, string> = {
  all: 'Todas',
  interview: 'Entrevistas',
  service: 'Servicios',
  workplace: 'Trabajo',
  social: 'Social',
  generated: 'Mis diálogos',
}

