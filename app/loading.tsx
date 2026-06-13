import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { FALLBACK_WORDS } from '@/hooks/useLoadingWords'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <WordCarousel words={FALLBACK_WORDS} />
    </div>
  )
}
