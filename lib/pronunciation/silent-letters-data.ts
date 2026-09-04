export interface SilentLetterItem {
  id: string
  word: string
  silentLetter: string
  ipa: string
  meaningEs: string
  spanishTrapEs: string
  exampleSentence: string
}

export const SILENT_LETTERS_DATA: SilentLetterItem[] = [
  // ─── Silent K ────────────────────────────────────────────────────────
  {
    id: 'silent-k-know',
    word: 'know',
    silentLetter: 'k',
    ipa: '/noʊ/',
    meaningEs: 'saber / conocer',
    spanishTrapEs: 'La "k" antes de "n" es 100% muda. No digas "k-now", empieza directo con /n/.',
    exampleSentence: 'I know the answer.',
  },
  {
    id: 'silent-k-knife',
    word: 'knife',
    silentLetter: 'k',
    ipa: '/naɪf/',
    meaningEs: 'cuchillo',
    spanishTrapEs: 'La "k" no suena en absoluto. Se pronuncia idéntico a empezar con "naif".',
    exampleSentence: 'Use a sharp knife.',
  },
  {
    id: 'silent-k-knee',
    word: 'knee',
    silentLetter: 'k',
    ipa: '/niː/',
    meaningEs: 'rodilla',
    spanishTrapEs: 'Ignora la "k". Suena exactamente como /niː/.',
    exampleSentence: 'He hurt his right knee.',
  },

  // ─── Silent B ────────────────────────────────────────────────────────
  {
    id: 'silent-b-doubt',
    word: 'doubt',
    silentLetter: 'b',
    ipa: '/daʊt/',
    meaningEs: 'duda',
    spanishTrapEs: 'La "b" antes de "t" jamás se pronuncia. Di "daut", nunca "dobt".',
    exampleSentence: 'I have no doubt about it.',
  },
  {
    id: 'silent-b-debt',
    word: 'debt',
    silentLetter: 'b',
    ipa: '/dɛt/',
    meaningEs: 'deuda',
    spanishTrapEs: 'La "b" es invisible al oído. Se pronuncia simplemente "det".',
    exampleSentence: 'He paid off his debt.',
  },
  {
    id: 'silent-b-climb',
    word: 'climb',
    silentLetter: 'b',
    ipa: '/klaɪm/',
    meaningEs: 'escalar / subir',
    spanishTrapEs: 'La "b" final después de "m" no suena. Termina en /m/, no en /b/.',
    exampleSentence: 'Let us climb the mountain.',
  },
  {
    id: 'silent-b-thumb',
    word: 'thumb',
    silentLetter: 'b',
    ipa: '/θʌm/',
    meaningEs: 'pulgar',
    spanishTrapEs: 'Termina el sonido cerrando los labios en la "m". La "b" no existe acústicamente.',
    exampleSentence: 'Give a thumbs up.',
  },

  // ─── Silent L ────────────────────────────────────────────────────────
  {
    id: 'silent-l-salmon',
    word: 'salmon',
    silentLetter: 'l',
    ipa: '/ˈsæm.ən/',
    meaningEs: 'salmón',
    spanishTrapEs: '¡Trampa clásica! En inglés no se pronuncia la "l". Suena «sa-mon», no «sal-mon».',
    exampleSentence: 'We ordered fresh salmon.',
  },
  {
    id: 'silent-l-walk',
    word: 'walk',
    silentLetter: 'l',
    ipa: '/wɔːk/',
    meaningEs: 'caminar',
    spanishTrapEs: 'La "l" no suena. La vocal se alarga: «wook», nunca «gualk».',
    exampleSentence: 'I walk to work every day.',
  },
  {
    id: 'silent-l-half',
    word: 'half',
    silentLetter: 'l',
    ipa: '/hæf/',
    meaningEs: 'mitad',
    spanishTrapEs: 'No pronuncies la "l". Di directamente /hæf/.',
    exampleSentence: 'Cut it in half.',
  },

  // ─── Silent W ────────────────────────────────────────────────────────
  {
    id: 'silent-w-write',
    word: 'write',
    silentLetter: 'w',
    ipa: '/raɪt/',
    meaningEs: 'escribir',
    spanishTrapEs: 'La "w" antes de "r" no suena. Suena exactamente igual que "right".',
    exampleSentence: 'Please write your name.',
  },
  {
    id: 'silent-w-answer',
    word: 'answer',
    silentLetter: 'w',
    ipa: '/ˈæn.sər/',
    meaningEs: 'respuesta / responder',
    spanishTrapEs: 'La "w" interior es muda. Di «an-ser», nunca «an-suer».',
    exampleSentence: 'Can you answer the phone?',
  },

  // ─── Silent T ────────────────────────────────────────────────────────
  {
    id: 'silent-t-listen',
    word: 'listen',
    silentLetter: 't',
    ipa: '/ˈlɪs.ən/',
    meaningEs: 'escuchar',
    spanishTrapEs: 'La "t" desaparece entre la "s" y la "en". Suena «lis-en», no «lis-ten».',
    exampleSentence: 'Listen carefully to the audio.',
  },
  {
    id: 'silent-t-castle',
    word: 'castle',
    silentLetter: 't',
    ipa: '/ˈkæs.əl/',
    meaningEs: 'castillo',
    spanishTrapEs: 'La "t" en terminación "-stle" es muda. Di «cas-el», no «cas-tl».',
    exampleSentence: 'They visited an ancient castle.',
  },

  // ─── Silent P & GH ───────────────────────────────────────────────────
  {
    id: 'silent-p-receipt',
    word: 'receipt',
    silentLetter: 'p',
    ipa: '/rɪˈsiːt/',
    meaningEs: 'recibo / comprobante',
    spanishTrapEs: 'La "p" es totalmente muda. Pronúncialo «ri-siit».',
    exampleSentence: 'Keep your receipt for proof.',
  },
  {
    id: 'silent-gh-through',
    word: 'through',
    silentLetter: 'gh',
    ipa: '/θruː/',
    meaningEs: 'a través de',
    spanishTrapEs: 'El grupo "gh" no suena ni como /g/ ni como /j/. Solo suena la vocal /uː/.',
    exampleSentence: 'Walk through the open door.',
  },
]

export function silentLettersToConnectedPhrases() {
  return SILENT_LETTERS_DATA.map((item) => ({
    id: item.id,
    phrase: item.exampleSentence,
    category: 'silent-letters' as const,
    categoryNameEs: 'Letras Mudas (Silent Letters)',
    connectedIpa: item.ipa,
    isolatedIpa: item.ipa,
    howItSoundsEs: `«${item.word}» sin la letra "${item.silentLetter}"`,
    explanationEs: item.spanishTrapEs,
    linkedWords: [item.word, ''] as [string, string],
    linkSound: `Muda: ${item.silentLetter.toUpperCase()}`,
  }))
}
