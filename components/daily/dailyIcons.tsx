import {
  BookMarked,
  Waves,
  GitCompareArrows,
  Headphones,
  GraduationCap,
  LayoutList,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

/** Mapa nombre→icono usado por los pasos de la diaria (DailyStep.icon). */
const ICONS: Record<string, LucideIcon> = {
  BookMarked,
  Waves,
  GitCompareArrows,
  Headphones,
  GraduationCap,
  LayoutList,
  Sparkles,
}

export function DailyStepIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon size={size} />
}
