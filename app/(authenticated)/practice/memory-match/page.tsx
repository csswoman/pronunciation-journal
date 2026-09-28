import { readFileSync } from 'fs'
import { resolve } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import MemoryMatchSession from '@/components/practice/memory-match/MemoryMatchSession'
import type { MemoryWordItem } from '@/lib/games/memory-match/schema'

export const metadata = {
  title: 'Memory Match | English Journal',
  description: 'Juego de memoria y asociación de vocabulario, audio e IPA',
}

function loadMemoryWords(): MemoryWordItem[] {
  const filePath = resolve(process.cwd(), 'public/essential-words/words-001.json')
  try {
    const fileData = readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(fileData)
    const entries = parsed.entries ?? []

    return entries
      .filter(
        (e: { word?: string; translation?: string; ipa_strong?: string; rank?: number }) =>
          e.word && e.translation && e.ipa_strong && e.word.length <= 8,
      )
      .slice(0, 50)
      .map(
        (e: { word: string; translation: string; ipa_strong: string; rank: number }) => ({
          id: `mem-${e.rank}-${e.word}`,
          word: e.word,
          meaningEs: e.translation,
          ipa: e.ipa_strong,
        }),
      )
  } catch (err) {
    console.error(`[MemoryMatchPage] Failed to load ${filePath}; using fallback words:`, err)
    return [
      { id: 'm1', word: 'apple', meaningEs: 'manzana', ipa: '/ˈæp.əl/' },
      { id: 'm2', word: 'water', meaningEs: 'agua', ipa: '/ˈwɔː.tər/' },
      { id: 'm3', word: 'house', meaningEs: 'casa', ipa: '/haʊs/' },
      { id: 'm4', word: 'smile', meaningEs: 'sonrisa', ipa: '/smaɪl/' },
      { id: 'm5', word: 'chair', meaningEs: 'silla', ipa: '/tʃeər/' },
      { id: 'm6', word: 'table', meaningEs: 'mesa', ipa: '/ˈteɪ.bəl/' },
    ]
  }
}

export default function MemoryMatchPage() {
  const words = loadMemoryWords()

  return (
    <PageLayout archetype="catalog">
      <MemoryMatchSession words={words} />
    </PageLayout>
  )
}
