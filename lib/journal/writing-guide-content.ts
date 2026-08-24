export interface VerbTenseExample {
  english: string
  spanish: string
}

export interface VerbTenseGroup {
  tense: 'present' | 'past' | 'future'
  label: string
  examples: VerbTenseExample[]
}

export interface UsefulPhraseGroup {
  purpose: string
  phrases: string[]
}

export const VERB_TENSE_GUIDE: VerbTenseGroup[] = [
  {
    tense: 'present',
    label: 'Presente',
    examples: [
      { english: 'I write in my journal every day.', spanish: 'Escribo en mi diario todos los días.' },
      { english: 'She goes to work by bus.', spanish: 'Ella va al trabajo en autobús.' },
      { english: 'They have two dogs.', spanish: 'Ellos tienen dos perros.' },
    ],
  },
  {
    tense: 'past',
    label: 'Pasado',
    examples: [
      { english: 'I wrote in my journal yesterday.', spanish: 'Escribí en mi diario ayer.' },
      { english: 'She went to work by bus.', spanish: 'Ella fue al trabajo en autobús.' },
      { english: 'They had two dogs.', spanish: 'Ellos tenían dos perros.' },
    ],
  },
  {
    tense: 'future',
    label: 'Futuro',
    examples: [
      { english: 'I will write in my journal tomorrow.', spanish: 'Escribiré en mi diario mañana.' },
      { english: 'She will go to work by bus.', spanish: 'Ella irá al trabajo en autobús.' },
      { english: 'They will have two dogs.', spanish: 'Ellos tendrán dos perros.' },
    ],
  },
]

export const USEFUL_PHRASES_GUIDE: UsefulPhraseGroup[] = [
  {
    purpose: 'Contar algo que pasó (Pasado)',
    phrases: ['Yesterday I...', 'This morning I had the chance to...', 'A few days ago I noticed...', 'Last weekend I decided to...'],
  },
  {
    purpose: 'Dar tu opinión y puntos de vista',
    phrases: ['In my opinion...', 'I personally believe that...', 'From my perspective...', 'It seems to me that...'],
  },
  {
    purpose: 'Contrastar ideas (Sin embargo / Aunque)',
    phrases: ['However, ...', 'Even though...', 'On the other hand, ...', 'Although it was difficult, ...'],
  },
  {
    purpose: 'Causa y efecto (Porque / Por eso)',
    phrases: ['Because of this, ...', 'As a result, ...', 'For that reason, ...', 'Since I wanted to improve, ...'],
  },
  {
    purpose: 'Dar ejemplos y detalles',
    phrases: ['For example, ...', 'For instance, ...', 'Such as...', 'In particular, ...'],
  },
  {
    purpose: 'Concluir o reflexionar',
    phrases: ['Looking back, ...', 'All in all, ...', 'What I learned is that...', 'In the end, ...'],
  },
]
