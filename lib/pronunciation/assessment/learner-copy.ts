/**
 * Learner-facing Spanish copy for pronunciation diagnostic targets.
 * Registry `label` stays English for authoring; UI and prescriptions use this.
 */

import {
  contrastTargetId,
  getTarget,
  listTargets,
  phonemeTargetId,
  targetId,
} from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export interface LearnerTargetCopy {
  /** Short Spanish title for lists, headings, and plans. */
  title: string
  /** Optional IPA / technical hint (render with `font-ipa`). */
  ipaHint?: string
  /** English word/phrase to speak in production prompts (STT target text). */
  speakCue?: string
  /**
   * Plain-language gloss + concrete example for first-timers
   * (esp. prosody labels that don't name a sound).
   */
  plainHint?: string
}

const LEARNER_COPY_BY_ID: Readonly<Record<string, LearnerTargetCopy>> = Object.freeze({
  [contrastTargetId('/θ/', '/ð/')]: {
    title: 'Los dos sonidos TH',
    ipaHint: 'θ / ð',
    speakCue: 'I think this is thin',
  },
  [contrastTargetId('/iː/', '/ɪ/')]: {
    title: 'ship vs sheep',
    ipaHint: 'ɪ / iː',
    speakCue: 'This sheep is on the ship',
  },
  [contrastTargetId('/b/', '/v/')]: {
    title: 'B vs V en inglés',
    ipaHint: 'b / v',
    speakCue: 'very big berry',
    plainHint: 'En inglés la V se pronuncia mordiendo el labio inferior con los dientes.',
  },
  [contrastTargetId('/æ/', '/ʌ/')]: {
    title: 'cat vs cut',
    ipaHint: 'æ / ʌ',
    speakCue: 'The cat cut the rope',
    plainHint: '/æ/ es una sonrisa abierta; /ʌ/ es una vocal corta y relajada.',
  },
  [contrastTargetId('/s/', '/z/')]: {
    title: 'S sorda vs Z sonora',
    ipaHint: 's / z',
    speakCue: 'The price and the prize',
    plainHint: 'La Z vibra en la garganta como el zumbido de una abeja.',
  },
  [contrastTargetId('/ʃ/', '/tʃ/')]: {
    title: 'sh vs ch',
    ipaHint: 'ʃ / tʃ',
    speakCue: 'Share the chair',
    plainHint: '/ʃ/ es suave continuo (shh); /tʃ/ es seco y explosivo (ch).',
  },
  [phonemeTargetId('/ɹ/')]: {
    title: 'La R americana',
    ipaHint: 'ɹ',
    speakCue: 'red bird',
    plainHint: 'La punta de la lengua se curva hacia atrás sin tocar el paladar.',
  },
  [phonemeTargetId('/ə/')]: {
    title: 'La vocal relajada',
    ipaHint: 'ə',
    speakCue: 'a banana',
  },
  [targetId('prosody.word-stress')]: {
    // Avoid "acento" alone — in Spanish it often means regional accent (UK/US).
    title: 'La sílaba tónica',
    speakCue: 'photograph',
    plainHint:
      'No es el acento británico o americano: es qué sílaba suena más fuerte dentro de una palabra. Ejemplo: photograph → ¿PHO-to-graph o pho-TO-graph?',
  },
  [targetId('prosody.sentence-stress')]: {
    title: 'Las palabras fuertes de la frase',
    speakCue: 'I want a cup of coffee',
    plainHint:
      'No es un acento regional: es qué palabras suenan más fuertes en la frase (las importantes). Ejemplo: I want a CUP of COFfee.',
  },
  [targetId('prosody.rhythm')]: {
    title: 'El ritmo de la frase',
    speakCue: 'I want to go to the store',
    plainHint:
      'El vaivén entre sílabas fuertes y débiles al hablar en inglés, sin marcar cada sílaba igual.',
  },
  [targetId('prosody.intonation.rising-question')]: {
    title: 'Entonación de preguntas sí/no',
    speakCue: 'Are you ready?',
    plainHint:
      'Si la voz sube al final en preguntas de sí/no. Ejemplo: Are you ready?↗',
  },
  [targetId('connected.reduction.gonna')]: {
    title: 'going to → gonna',
    speakCue: "I'm gonna call you later",
  },
  [targetId('connected.linking')]: {
    title: 'Unir sonidos entre palabras',
    speakCue: 'an apple a day',
  },
  [targetId('connected.elision')]: {
    title: 'Sonidos que se omiten',
    speakCue: 'next please',
  },
  [targetId('connected.assimilation')]: {
    title: 'Sonidos que se funden',
    ipaHint: 'doncha / didja',
    speakCue: "Don't you know?",
  },
})

function fallbackCopy(id: string): LearnerTargetCopy {
  const lookup = getTarget(id)
  if (lookup.ok) {
    return { title: lookup.target.label, speakCue: lookup.target.label }
  }
  return { title: id, speakCue: id }
}

/** Learner-facing title + optional IPA + speak cue for a registry target. */
export function getLearnerTargetCopy(targetIdValue: string | PronunciationTargetId): LearnerTargetCopy {
  return LEARNER_COPY_BY_ID[targetIdValue] ?? fallbackCopy(targetIdValue)
}

/**
 * Dev/test guard: every registry target should have an explicit learner entry
 * so we never leak authoring English into the diagnostic UI by accident.
 */
export function listTargetsMissingLearnerCopy(): string[] {
  return listTargets()
    .map((t) => t.id)
    .filter((id) => !(id in LEARNER_COPY_BY_ID))
}
