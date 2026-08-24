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
]
