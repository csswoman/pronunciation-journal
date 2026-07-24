import type { WritingHintRuleId } from './types'

/** Spanish explanations for each writing-hint rule, shown in the tooltip. */
const HINT_MESSAGES: Record<WritingHintRuleId, string> = {
  'irregular-past': 'Este verbo es irregular en pasado. Revisa la forma correcta.',
  'missing-past-ed': 'Parece que hablas del pasado. ¿Necesita este verbo terminar en "-ed"?',
  'am-agree': '"Agree" no lleva "am" antes. Prueba solo "I agree".',
  'double-negative': 'En inglés no se usan dos negaciones juntas.',
  'missing-third-person-s': 'Con he/she/it, el verbo en presente suele llevar "-s".',
  'irregular-plural': 'Este plural es irregular. Revisa la forma correcta.',
  'missing-apostrophe': 'A esta contracción le falta el apóstrofo.',
}

export function writingHintMessage(ruleId: WritingHintRuleId): string {
  return HINT_MESSAGES[ruleId]
}
