import { readFileSync } from 'fs'
import { resolve } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import PhonemeInvadersSession from '@/components/practice/phoneme-invaders/PhonemeInvadersSession'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'

export const metadata = {
  title: 'Phoneme Invaders | English Journal',
  description: 'Juego arcade de discriminación auditiva y fonemas en inglés',
}

function loadPairsData(): MinimalPairItem[] {
  try {
    const filePath = resolve(process.cwd(), 'public/games/phoneme-invaders/pairs.json')
    const fileData = readFileSync(filePath, 'utf-8')
    return JSON.parse(fileData)
  } catch {
    return []
  }
}

export default function PhonemeInvadersPage() {
  const pairs = loadPairsData()

  return (
    <PageLayout archetype="catalog">
      <PhonemeInvadersSession pairs={pairs} />
    </PageLayout>
  )
}
