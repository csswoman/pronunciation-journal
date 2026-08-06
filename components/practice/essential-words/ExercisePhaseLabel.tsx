'use client'

interface Props {
  label?: string
}

export function ExercisePhaseLabel({ label }: Props) {
  if (!label) return null
  return (
    <p className="m-0 w-full text-center font-caption text-fg-muted">{label}</p>
  )
}
