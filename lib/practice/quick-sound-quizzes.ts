export type SoundCategory = 'all' | 'vowels' | 'consonants'

export interface QuickSoundQuiz {
  id: string
  category: 'vowels' | 'consonants'
  word: string
  phoneme: string
  meaning: string
  distractor: string
  distractorWord: string
  distractorPhoneme: string
  explanation: string
  mouthTip: string
}

export const QUICK_SOUND_QUIZZES: QuickSoundQuiz[] = [
  {
    id: 'sheep-ship',
    category: 'vowels',
    word: 'sheep',
    phoneme: '/iː/',
    meaning: 'oveja',
    distractor: 'ship',
    distractorWord: 'ship (barco)',
    distractorPhoneme: '/ɪ/',
    explanation: '¡Exacto! /iː/ es una vocal larga y sonriente (sheep), mientras que /ɪ/ es corta y relajada (ship).',
    mouthTip: 'Sonríe ligeramente y tensa los lados de la lengua contra los molares superiores.',
  },
  {
    id: 'fool-full',
    category: 'vowels',
    word: 'fool',
    phoneme: '/uː/',
    meaning: 'tonto',
    distractor: 'full',
    distractorWord: 'full (lleno)',
    distractorPhoneme: '/ʊ/',
    explanation: '¡Muy bien! /uː/ requiere redondear y tensar bien los labios hacia adelante.',
    mouthTip: 'Redondea los labios fuertemente como si fueras a silbar.',
  },
  {
    id: 'cat-cut',
    category: 'vowels',
    word: 'cat',
    phoneme: '/æ/',
    meaning: 'gato',
    distractor: 'cut',
    distractorWord: 'cut (cortar)',
    distractorPhoneme: '/ʌ/',
    explanation: '¡Perfecto! /æ/ es una vocal abierta: la mandíbula baja más que en español.',
    mouthTip: 'Abre bien la mandíbula hacia abajo y aplana la lengua en la base de la boca.',
  },
  {
    id: 'think-sink',
    category: 'consonants',
    word: 'think',
    phoneme: '/θ/',
    meaning: 'pensar',
    distractor: 'sink',
    distractorWord: 'sink (hundir/lavabo)',
    distractorPhoneme: '/s/',
    explanation: '¡Muy bien! /θ/ se pronuncia colocando la punta de la lengua suavemente entre los dientes.',
    mouthTip: 'Asoma la punta de la lengua entre los incisivos y sopla suavemente sin tocar el paladar.',
  },
  {
    id: 'berry-very',
    category: 'consonants',
    word: 'berry',
    phoneme: '/b/',
    meaning: 'baya / fruto rojo',
    distractor: 'very',
    distractorWord: 'very (muy)',
    distractorPhoneme: '/v/',
    explanation: '¡Excelente! /b/ es bilabial (juntando ambos labios), mientras /v/ apoya los dientes en el labio inferior.',
    mouthTip: 'Junta ambos labios por completo para crear una pequeña oclusión antes de liberar el aire.',
  },
  {
    id: 'right-light',
    category: 'consonants',
    word: 'right',
    phoneme: '/r/',
    meaning: 'correcto / derecha',
    distractor: 'light',
    distractorWord: 'light (luz/ligero)',
    distractorPhoneme: '/l/',
    explanation: '¡Correcto! En inglés la /r/ nunca toca el paladar ni vibra.',
    mouthTip: 'Curva la punta de la lengua hacia atrás en el aire sin llegar a tocar el paladar.',
  },
]
