import { notFound } from 'next/navigation'
import '@/app/styles/exercise-test.css'

export const metadata = { title: 'Galería de ejercicios' }

export default async function ExerciseTestPage() {
  if (process.env.NODE_ENV === 'development') {
    const { ExerciseTestHub } = await import('@/components/practice/test/ExerciseTestHub')
    return (
      <div className="min-h-dvh bg-surface-base">
        <ExerciseTestHub />
      </div>
    )
  }

  notFound()
}
