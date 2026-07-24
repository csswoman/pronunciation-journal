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
    purpose: 'Contar algo que pasó',
    phrases: ['Yesterday I...', 'Last week I...', 'This morning I...', 'A few days ago...'],
  },
  {
    purpose: 'Dar tu opinión',
    phrases: ['I think that...', 'In my opinion...', 'I feel like...', 'I believe...'],
  },
  {
    purpose: 'Conectar ideas',
    phrases: ['because', 'however', 'and then', 'so', 'but', 'also'],
  },
]
