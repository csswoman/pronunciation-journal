import { contrastTargetId } from '@/lib/pronunciation/targets/registry'
import type { ScriptedMission } from '../types'

/**
 * Guiones autorados. Sin `modelAudio` por ahora: el pipeline de audio
 * pregenerado es trabajo aparte, y `resolveModelAudio` cae limpiamente en
 * síntesis mientras tanto. Al añadir los OGG, basta con rellenar el campo.
 */
export const SCRIPTED_MISSIONS: readonly ScriptedMission[] = [
  {
    id: 'scripted.cafe.order',
    mode: 'scripted',
    origin: 'authored',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'Pides algo de beber en una cafetería.',
    communicativeGoal: 'Pedir una bebida y responder a las preguntas del camarero.',
    targets: [],
    script: [
      { id: 'cafe-1', speaker: 'coach', text: 'Hi there! What can I get for you today?' },
      { id: 'cafe-2', speaker: 'learner', text: "I'd like a large coffee, please." },
      { id: 'cafe-3', speaker: 'coach', text: 'Sure. Room for milk?' },
      { id: 'cafe-4', speaker: 'learner', text: 'Yes, just a little bit.' },
      { id: 'cafe-5', speaker: 'coach', text: "That'll be four fifty." },
      { id: 'cafe-6', speaker: 'learner', text: 'Here you go. Thank you!' },
    ],
  },
  {
    id: 'scripted.interview.intro',
    mode: 'scripted',
    origin: 'authored',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'Los primeros minutos de una entrevista de trabajo.',
    communicativeGoal: 'Presentarte y explicar por qué te interesa el puesto.',
    targets: [{ targetId: contrastTargetId('/iː/', '/ɪ/'), phrase: 'this team' }],
    script: [
      { id: 'int-1', speaker: 'coach', text: 'Thanks for coming in. Tell me a little about yourself.' },
      {
        id: 'int-2', speaker: 'learner',
        text: "I'm a software developer with three years of experience.",
      },
      { id: 'int-3', speaker: 'coach', text: 'What interests you about this position?' },
      {
        id: 'int-4', speaker: 'learner',
        text: 'I really like the problems this team is solving.',
        targetId: contrastTargetId('/iː/', '/ɪ/'),
      },
      { id: 'int-5', speaker: 'coach', text: 'Great. What would you say is your biggest strength?' },
      { id: 'int-6', speaker: 'learner', text: 'I learn quickly and I ask good questions.' },
    ],
  },
]
