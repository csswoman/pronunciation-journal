import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import FalseFriendsSwipeSession from '@/components/practice/false-friends-swipe/FalseFriendsSwipeSession'
import type { FalseFriend } from '@/lib/false-friends/types'

export const metadata = {
  title: '¿Trampa? Falsos Amigos | English Journal',
  description: 'Desactiva las traducciones falsas más engañosas en inglés',
}

function loadFalseFriendsData(): FalseFriend[] {
  const dirPath = resolve(process.cwd(), 'public/false-friends')
  try {
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.json'))
    const collected: FalseFriend[] = []

    for (const file of files) {
      const filePath = resolve(dirPath, file)
      try {
        const content = readFileSync(filePath, 'utf-8')
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed.entries)) {
          collected.push(...parsed.entries)
        }
      } catch (err) {
        console.error(`[FalseFriendsSwipePage] Failed to load ${filePath}:`, err)
        return []
      }
    }
    return collected
  } catch (err) {
    console.error(`[FalseFriendsSwipePage] Failed to read content directory ${dirPath}:`, err)
    return []
  }
}

export default function FalseFriendsSwipePage() {
  const entries = loadFalseFriendsData()

  return (
    <PageLayout archetype="catalog">
      <FalseFriendsSwipeSession entries={entries} />
    </PageLayout>
  )
}
