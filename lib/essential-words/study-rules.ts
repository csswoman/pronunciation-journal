/** Shared, reviewed rules reused by authored Essential Words study entries. */
export const STUDY_RULES = {
  article_general_vs_specific: "Se omite al hablar en general; se usa cuando ya se sabe de cuál hablas.",
  uncountable_no_plural: "En inglés es incontable: no se usa en plural ni con a/an.",
  news_singular: "News termina en s, pero normalmente usa verbo singular.",
  subject_pronoun_required: "El inglés necesita expresar el sujeto; el español puede omitirlo.",
  purpose_to_vs_for: "To introduce propósito antes de un verbo; for indica destinatario, beneficio o duración.",
  in_on_at_time_place: "In indica dentro o periodos amplios; on, superficies y días; at, puntos y horas.",
  by_agent_method_deadline: "By indica agente, medio o fecha límite.",
  indefinite_article_a_an: "A y an presentan algo no específico: a va antes de sonido de consonante y an antes de sonido vocálico; the se usa cuando ya se sabe de cuál hablas.",
  dummy_it_subject: "El inglés usa it como sujeto en expresiones de clima y tiempo.",
  as_role_vs_like: "As indica función o papel; like indica semejanza.",
  source_from_vs_of_or_possessive: "From indica origen; la posesión suele expresarse con of o con ’s.",
  with_verb_complements: "La preposición que sigue a un verbo depende de ese verbo.",
} as const;

export type StudyRuleId = keyof typeof STUDY_RULES;

export function studyRuleText(ruleId: StudyRuleId): string {
  return STUDY_RULES[ruleId];
}
