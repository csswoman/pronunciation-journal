import { notFound } from 'next/navigation'
import { ExerciseTestHub } from '@/components/practice/test/ExerciseTestHub'
import '@/app/styles/exercise-test.css'

export const metadata = { title: 'Galería de ejercicios' }

export default function ExerciseTestPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="min-h-dvh bg-surface-base">
      <ExerciseTestHub />
    </div>
  )
}
