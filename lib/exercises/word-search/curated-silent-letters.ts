import type { WordSearchItem } from './types'
import { SILENT_LETTERS_DATA } from '@/lib/pronunciation/silent-letters-data'

const SUPPLEMENTAL_SILENT_WORDS: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = [
  {
    id: 'sl-supp-knight',
    word: 'KNIGHT',
    displayWord: 'knight',
    ipa: '/naɪt/',
    clue: 'A historical soldier in armor; starts with a silent K.',
    meaningEs: 'Caballero (medieval)',
    exampleSentence: 'The brave knight protected the kingdom.',
  },
  {
    id: 'sl-supp-wrist',
    word: 'WRIST',
    displayWord: 'wrist',
    ipa: '/rɪst/',
    clue: 'The joint connecting the hand to the arm; silent W.',
    meaningEs: 'Muñeca (articulación)',
    exampleSentence: 'He wears a watch on his left wrist.',
  },
  {
    id: 'sl-supp-honest',
    word: 'HONEST',
    displayWord: 'honest',
    ipa: '/ˈɒn.ɪst/',
    clue: 'Telling the truth and not lying; starts with a silent H.',
    meaningEs: 'Honesto / Sincero',
    exampleSentence: 'Always be honest with yourself.',
  },
  {
    id: 'sl-supp-island',
    word: 'ISLAND',
    displayWord: 'island',
    ipa: '/ˈaɪ.lənd/',
    clue: 'A piece of land surrounded by water; silent S.',
    meaningEs: 'Isla',
    exampleSentence: 'They sailed to a tropical island.',
  },
  {
    id: 'sl-supp-muscle',
    word: 'MUSCLE',
    displayWord: 'muscle',
    ipa: '/ˈmʌs.əl/',
    clue: 'Body tissue that can contract to produce movement; silent C.',
    meaningEs: 'Músculo',
    exampleSentence: 'Regular exercise builds strong muscle.',
  },
  {
    id: 'sl-supp-autumn',
    word: 'AUTUMN',
    displayWord: 'autumn',
    ipa: '/ˈɔː.təm/',
    clue: 'The season between summer and winter; silent N.',
    meaningEs: 'Otoño',
    exampleSentence: 'The leaves turn golden in autumn.',
  },
  {
    id: 'sl-supp-sword',
    word: 'SWORD',
    displayWord: 'sword',
    ipa: '/sɔːd/',
    clue: 'A weapon with a long metal blade; silent W.',
    meaningEs: 'Espada',
    exampleSentence: 'The warrior drew his sharp sword.',
  },
  {
    id: 'sl-supp-comb',
    word: 'COMB',
    displayWord: 'comb',
    ipa: '/kəʊm/',
    clue: 'A toothed device used for arranging hair; silent B.',
    meaningEs: 'Peine',
    exampleSentence: 'She used a wide comb on her wet hair.',
  },
  {
    id: 'sl-supp-subtle',
    word: 'SUBTLE',
    displayWord: 'subtle',
    ipa: '/ˈsʌt.əl/',
    clue: 'Delicate, precise, or hard to notice; silent B.',
    meaningEs: 'Sutil',
    exampleSentence: 'There is a subtle difference in pronunciation.',
  },
  {
    id: 'sl-supp-gnome',
    word: 'GNOME',
    displayWord: 'gnome',
    ipa: '/noʊm/',
    clue: 'A mythical garden creature; starts with a silent G.',
    meaningEs: 'Gnomo',
    exampleSentence: 'There is a decorative gnome in the garden.',
  },
  {
    id: 'sl-supp-lamb',
    word: 'LAMB',
    displayWord: 'lamb',
    ipa: '/læm/',
    clue: 'A young sheep; contains a silent B.',
    meaningEs: 'Cordero',
    exampleSentence: 'The little lamb stayed close to its mother.',
  },
  {
    id: 'sl-supp-foreign',
    word: 'FOREIGN',
    displayWord: 'foreign',
    ipa: '/ˈfɔːr.ən/',
    clue: 'From or in a country other than your own; silent G.',
    meaningEs: 'Extranjero',
    exampleSentence: 'Learning a foreign language takes dedication.',
  },
  {
    id: 'sl-supp-hour',
    word: 'HOUR',
    displayWord: 'hour',
    ipa: '/aʊər/',
    clue: 'A period of time equal to 60 minutes; starts with a silent H.',
    meaningEs: 'Hora',
    exampleSentence: 'The meeting lasted for one full hour.',
  },
]

// Convert project SILENT_LETTERS_DATA entries
const fromSilentLettersData: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> =
  SILENT_LETTERS_DATA.map((item) => ({
    id: item.id,
    word: item.word.toUpperCase(),
    displayWord: item.word.toLowerCase(),
    ipa: item.ipa,
    clue: `${item.meaningEs}. ${item.spanishTrapEs}`,
    meaningEs: item.meaningEs,
    exampleSentence: item.exampleSentence,
  }))

// Combine and deduplicate
const combined = [...fromSilentLettersData, ...SUPPLEMENTAL_SILENT_WORDS]
const seen = new Set<string>()

export const SILENT_LETTER_WORDS: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> =
  combined.filter((item) => {
    const key = item.word.toUpperCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

