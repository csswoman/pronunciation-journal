import { readFileSync } from 'fs'
import { resolve } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import WeakFormSession from '@/components/practice/weak-form-catcher/WeakFormSession'
import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'

export const metadata = {
  title: 'Weak Form Catcher | English Journal',
  description: 'Entrena tu oído con inglés rápido y formas reducidas',
}

function loadPhrasesData(): WeakFormPhraseItem[] {
  const filePath = resolve(process.cwd(), 'public/games/weak-forms/phrases-001.json')
  try {
    const fileData = readFileSync(filePath, 'utf-8')
    return JSON.parse(fileData)
  } catch (err) {
    console.error(`[WeakFormCatcherPage] Failed to load ${filePath}:`, err)
    return []
  }
}

export default function WeakFormCatcherPage() {
  const phrases = loadPhrasesData()

  return (
    <PageLayout archetype="catalog">
      <WeakFormSession phrases={phrases} />
    </PageLayout>
  )
}
