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
  [phonemeTargetId('/ə/')]: {
    title: 'La vocal relajada',
    ipaHint: 'ə',
    speakCue: 'a banana',
  },
  [targetId('prosody.word-stress')]: {
    title: 'El acento en la palabra',
    speakCue: 'photograph',
  },
  [targetId('prosody.sentence-stress')]: {
    title: 'El acento en la frase',
    speakCue: 'I want a cup of coffee',
  },
  [targetId('prosody.rhythm')]: {
    title: 'El ritmo de la frase',
    speakCue: 'I want to go to the store',
  },
  [targetId('prosody.intonation.rising-question')]: {
    title: 'Entonación de preguntas sí/no',
    speakCue: 'Are you ready?',
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
