export interface GuidedTemplate {
  id: string
  promptEn: string
  promptEs: string
  starterPrefix: string
  options: string[]
}

export const GUIDED_TEMPLATES: readonly GuidedTemplate[] = [
  {
    id: 'talked-yesterday',
    promptEn: 'Who did you talk to yesterday?',
    promptEs: '¿Con quién hablaste ayer?',
    starterPrefix: 'Yesterday I talked to',
    options: ['my brother', 'my partner', 'a friend', 'my coworker'],
  },
  {
    id: 'small-win',
    promptEn: 'What was one small win from your day?',
    promptEs: '¿Qué fue un pequeño logro de tu día?',
    starterPrefix: 'One small win today was',
    options: ['finishing all my tasks', 'having a good conversation', 'drinking enough water', 'learning new words'],
  },
  {
    id: 'recently-decided',
    promptEn: 'What did you decide to do recently?',
    promptEs: '¿Qué decidiste hacer recientemente?',
    starterPrefix: 'Recently I decided to',
    options: ['practice English every day', 'read more often', 'sleep earlier', 'organize my routine'],
  },
  {
    id: 'feeling-today',
    promptEn: 'How do you feel about your progress?',
    promptEs: '¿Cómo te sientes respecto a tu progreso?',
    starterPrefix: 'Regarding my progress, I feel',
    options: ['motivated and focused', 'patient with myself', 'excited to improve', 'ready for more challenges'],
  },
  {
    id: 'noticed-today',
    promptEn: 'What is something you noticed today?',
    promptEs: '¿Qué fue algo que notaste hoy?',
    starterPrefix: 'Today I noticed that',
    options: ['the weather is pleasant', 'consistency really helps', 'I understand more easily', 'time moves quickly'],
  },
  {
    id: 'favourite-moment',
    promptEn: 'What was your favourite moment today?',
    promptEs: '¿Cuál fue tu momento favorito de hoy?',
    starterPrefix: 'My favourite moment today was',
    options: ['having breakfast calmly', 'talking to a friend', 'taking a short walk', 'listening to good music'],
  },
  {
    id: 'standup-yesterday',
    promptEn: 'What did you work on yesterday for your project?',
    promptEs: '¿En qué trabajaste ayer en tu proyecto?',
    starterPrefix: 'Yesterday I worked on',
    options: [
      'fixing a critical bug in production',
      'refactoring a component for better performance',
      'writing automated unit tests',
      'reviewing pull requests from my team',
    ],
  },
  {
    id: 'standup-today',
    promptEn: 'What is your main focus for today?',
    promptEs: '¿Cuál es tu enfoque principal para hoy?',
    starterPrefix: 'Today I plan to focus on',
    options: [
      'implementing the new UI features',
      'optimizing database queries and indexes',
      'pairing with my teammate on a tricky feature',
      'wrapping up the remaining API endpoints',
    ],
  },
  {
    id: 'standup-blockers',
    promptEn: 'Do you have any blockers or dependencies?',
    promptEs: '¿Tienes algún bloqueo o dependencias?',
    starterPrefix: 'Regarding blockers, I am',
    options: [
      'completely unblocked and moving ahead',
      'waiting on code review feedback before merging',
      'waiting for staging environment access',
      'blocked by an intermittent network issue',
    ],
  },
  {
    id: 'tech-solution',
    promptEn: 'How did you solve a technical challenge recently?',
    promptEs: '¿Cómo solucionaste un reto técnico recientemente?',
    starterPrefix: 'I solved the technical issue by',
    options: [
      'adding a composite index to speed up the query',
      'simplifying the state management logic',
      'memoizing expensive component renders',
      'reading the official documentation carefully',
    ],
  },
]
