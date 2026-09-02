import type { JournalEntryMode } from './types'

export type NotebookTopic = 'daily' | 'opinion' | 'fiction' | 'situational' | 'vocab' | 'free'

export interface PromptDefinition {
  id: string
  en: string
  es: string
}

export interface NotebookHome {
  totals: { pages: number; sentences: number }
  today: {
    date: string
    status: 'empty' | 'in_progress' | 'done'
    topic: NotebookTopic
    /** Modo con el que se escribió la entrada de hoy — decide qué editor reabrir. */
    entryMode?: JournalEntryMode
    prompt: { id?: string; en: string; es: string }
    preview?: string
    sentences?: number
    newWords?: number
  }
  pastPages: Array<{
    id: string
    date: string
    entryDate?: string
    displayDate?: string
    firstLine: string
    sentences: number
    newWords: number
    status?: 'reviewed' | 'unreviewed'
    errorCount?: number
  }>
}

export const TOPIC_PROMPTS: Record<NotebookTopic, PromptDefinition[]> = {
  daily: [
    {
      id: 'remembered-conversation',
      en: 'What conversation do you remember today?',
      es: '¿Qué conversación recuerdas de hoy?',
    },
    {
      id: 'small-win',
      en: 'What was one small win or achievement from your day?',
      es: '¿Cuál fue un pequeño logro o avance de tu día?',
    },
    {
      id: 'relaxing-place',
      en: 'Describe a comfortable place that helps you relax.',
      es: 'Describe un lugar cómodo que te ayude a relajarte.',
    },
    {
      id: 'daily-routine-change',
      en: 'What is one thing in your daily routine that you want to improve?',
      es: '¿Qué aspecto de tu rutina diaria te gustaría mejorar?',
    },
    {
      id: 'grateful-moment',
      en: 'What are two small things that made you smile today?',
      es: '¿Cuáles son dos pequeñas cosas que te hicieron sonreír hoy?',
    },
    {
      id: 'delicious-food',
      en: 'What did you eat today that you genuinely enjoyed?',
      es: '¿Qué comiste hoy que realmente disfrutaste?',
    },
  ],
  opinion: [
    {
      id: 'learn-this-week',
      en: 'Describe something you would like to learn this week and why.',
      es: 'Describe algo que te gustaría aprender esta semana y por qué.',
    },
    {
      id: 'remote-vs-office',
      en: 'Do you prefer working from home or from an office? Explain your reasons.',
      es: '¿Prefieres trabajar desde casa o en una oficina? Explica tus razones.',
    },
    {
      id: 'favorite-book-or-movie',
      en: 'What is a book or movie that left a strong impression on you?',
      es: '¿Qué libro o película te dejó una gran impresión?',
    },
    {
      id: 'technology-impact',
      en: 'In your opinion, what recent technology has improved everyday life the most?',
      es: 'En tu opinión, ¿qué tecnología reciente ha mejorado más la vida cotidiana?',
    },
    {
      id: 'travel-destination',
      en: 'If you could recommend one place in the world to visit, where would it be?',
      es: 'Si pudieras recomendar un lugar del mundo para visitar, ¿cuál sería?',
    },
  ],
  fiction: [
    {
      id: 'mystery-letter',
      en: 'Imagine you found an unopened letter from 50 years ago in your house.',
      es: 'Imagina que encuentras en tu casa una carta sin abrir de hace 50 años.',
    },
    {
      id: 'teleport-ten-minutes',
      en: 'You can teleport anywhere in the universe for exactly 10 minutes. Where do you go?',
      es: 'Puedes teletransportarte a cualquier lugar por 10 minutos. ¿Adónde vas?',
    },
    {
      id: 'secret-room',
      en: 'Describe a hidden secret room inside your dream home.',
      es: 'Describe una habitación secreta oculta en la casa de tus sueños.',
    },
    {
      id: 'time-capsule',
      en: 'What three items would you put into a time capsule for people 100 years from now?',
      es: '¿Qué tres objetos pondrías en una cápsula del tiempo para la gente dentro de 100 años?',
    },
  ],
  situational: [
    {
      id: 'work-email-update',
      en: 'Write a short friendly email to a colleague sharing a project update.',
      es: 'Escribe un correo breve y amigable a un colega con una actualización de proyecto.',
    },
    {
      id: 'hotel-request',
      en: 'You are staying at a hotel and need extra amenities or advice on local food. What do you ask?',
      es: 'Estás en un hotel y necesitas cosas adicionales o consejos de comida local. ¿Qué pides?',
    },
    {
      id: 'recommend-city-spot',
      en: 'A foreign tourist asks you for the best spot in your city to spend an afternoon. What do you say?',
      es: 'Un turista extranjero te pide el mejor lugar de tu ciudad para pasar la tarde. ¿Qué le recomiendas?',
    },
    {
      id: 'job-interview-strength',
      en: 'How would you explain your greatest professional strength in a simple interview answer?',
      es: '¿Cómo explicarías tu mayor fortaleza profesional en una respuesta sencilla de entrevista?',
    },
  ],
  vocab: [
    {
      id: 'negotiate-agree',
      en: 'Describe a moment where you had to negotiate or agree with someone.',
      es: 'Describe un momento donde tuviste que negociar o ponerte de acuerdo con alguien.',
    },
    {
      id: 'solve-challenge',
      en: 'Write about a challenge you solved recently using connectors like "however" and "finally".',
      es: 'Escribe sobre un desafío que resolviste usando conectores como "however" y "finally".',
    },
    {
      id: 'three-verbs-story',
      en: 'Tell a mini story using the verbs: notice, realize, and discover.',
      es: 'Cuenta una mini historia usando los verbos: notice, realize y discover.',
    },
    {
      id: 'phrasal-verbs-routine',
      en: 'Write about your morning routine using: wake up, figure out, and look forward to.',
      es: 'Escribe sobre tu rutina usando: wake up, figure out y look forward to.',
    },
  ],
  free: [
    {
      id: 'free-writing',
      en: 'Write freely about anything on your mind today.',
      es: 'Escribe libremente sobre lo que tengas en mente hoy.',
    },
    {
      id: 'free-reflection',
      en: 'Reflect on an interesting thought, idea, or feeling you had recently.',
      es: 'Reflexiona sobre un pensamiento, idea o sentimiento reciente.',
    },
  ],
}

export const SAMPLE_NOTEBOOK_DATA: NotebookHome = {
  totals: { pages: 12, sentences: 87 },
  today: {
    date: '2026-08-23',
    status: 'empty',
    topic: 'daily',
    prompt: {
      en: 'What conversation do you remember today?',
      es: '¿Qué conversación recuerdas de hoy?',
    },
  },
  pastPages: [
    {
      id: 'p-1',
      date: '22 ago',
      firstLine: 'Today I woke up early and had a strong coffee before walking to the park.',
      sentences: 6,
      newWords: 3,
    },
    {
      id: 'p-2',
      date: '21 ago',
      firstLine: 'I met with Lucas to discuss the new project timeline and design ideas.',
      sentences: 8,
      newWords: 5,
    },
    {
      id: 'p-3',
      date: '20 ago',
      firstLine: 'The weather was unusually rainy, so I spent the afternoon reading.',
      sentences: 5,
      newWords: 2,
    },
    {
      id: 'p-4',
      date: '18 ago',
      firstLine: 'We cooked homemade pasta for dinner and listened to quiet jazz music.',
      sentences: 7,
      newWords: 4,
    },
  ],
}
