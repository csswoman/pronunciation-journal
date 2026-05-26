'use client'

import { useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

interface PracticeButtonProps {
  categoryId: string
}

export function PracticeButton({ categoryId }: PracticeButtonProps) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.push(`/lexicon/${categoryId}/practice`)}
      className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-fg rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
    >
      <Dumbbell className="w-4 h-4" />
      Practice lesson
    </button>
  )
}
