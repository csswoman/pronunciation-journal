import type { WordSearchItem, WordSearchThemePreset } from './types'
import { SILENT_LETTER_WORDS } from './curated-silent-letters'
import { WORKPLACE_TECH_WORDS } from './curated-workplace'

export const WORD_SEARCH_PRESETS: WordSearchThemePreset[] = [
  {
    id: 'silent-letters',
    title: 'Letras mudas',
    description: 'Palabras con letras que se escriben pero no se pronuncian (K, B, W, L, H)',
    topicPrompt: 'Common English words with silent letters (like knight, debt, salmon, doubt, honest, thumb, write, castle)',
    level: 'intermediate',
  },
  {
    id: 'workplace-tech',
    title: 'Trabajo y tecnología',
    description: 'Términos de trabajo, reuniones y tecnología cotidiana',
    topicPrompt: 'Useful modern workplace and tech collaboration vocabulary: feedback, deadline, deploy, schedule, remote, update',
    level: 'intermediate',
  },
]

export const CURATED_PUZZLE_ITEMS: Record<string, Array<Omit<WordSearchItem, 'found' | 'foundAt'>>> = {
  'silent-letters': SILENT_LETTER_WORDS,
  'workplace-tech': WORKPLACE_TECH_WORDS,
}
