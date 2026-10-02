// Planned structure:
// <PhonemeStimulusCard>
//   <PhonemePlayButton />   — dark round button
//   <Caption />             — "Escucha el sonido /iː/"

import type { ReactNode } from 'react'

interface Props {
  button: ReactNode
  caption: ReactNode
}

/** Lilac stimulus panel: big dark play button with a caption underneath. */
export function PhonemeStimulusCard({ button, caption }: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-3xl bg-lilac px-4 py-8 text-center text-ink">
      {button}
      <p className="m-0 text-body-md font-medium text-ink!">{caption}</p>
    </div>
  )
}
