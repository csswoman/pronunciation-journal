import type { MissionCategory } from '@/lib/ai-practice/missions/types'

export const MISSION_CATEGORY_LABELS: Record<MissionCategory | 'all', string> = {
  all: 'Todas',
  interview: 'Entrevistas',
  service: 'Servicios',
  workplace: 'Trabajo',
  social: 'Social',
}
