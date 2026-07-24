export type WritingHintRuleId =
  | 'irregular-past'
  | 'missing-past-ed'
  | 'am-agree'
  | 'double-negative'
  | 'missing-third-person-s'
  | 'irregular-plural'
  | 'missing-apostrophe'

export interface WritingHintMatch {
  start: number
  end: number
  ruleId: WritingHintRuleId
}
