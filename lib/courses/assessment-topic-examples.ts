import type { AssessmentQuestionFeedback } from "./assessment-result-details";

export interface AssessmentTopicExample {
  phrase: string;
  ipa?: string;
  translation?: string;
  explanation?: string;
  minutes?: number;
}

const CANONICAL_TOPIC_EXAMPLES: Record<string, AssessmentTopicExample> = {
  "a2-pasado-continuo": {
    phrase: "I was watching TV when you called.",
    ipa: "/aɪ wəz ˈwɑːtʃɪŋ ˌtiːˈviː wɛn juː kɔːld/",
    translation: "Estaba viendo la tele cuando llamaste.",
    explanation: "Usaste el pasado simple para una acción que estaba en curso. Cuando algo la interrumpe, la acción larga va con was / were + -ing.",
    minutes: 6,
  },
  "a2-used-to": {
    phrase: "I used to play the guitar.",
    ipa: "/aɪ ˈjuːst tə pleɪ ðə ɡɪˈtɑːr/",
    translation: "Antes tocaba la guitarra.",
    explanation: "Lo confundiste con el presente. Used to habla de algo que hacías antes y ya no haces.",
    minutes: 5,
  },
  "a1-presente-simple": {
    phrase: "She works at a hospital.",
    ipa: "/ʃiː wɜːrks æt ə ˈhɑːspɪtl/",
    translation: "Ella trabaja en un hospital.",
    explanation: "Recuerda añadir -s o -es en la tercera persona (he, she, it) en presente simple.",
    minutes: 5,
  },
  "a1-verbo-to-be": {
    phrase: "They are from Spain.",
    ipa: "/ðeɪ ɑːr frʌm speɪn/",
    translation: "Ellos son de España.",
    explanation: "Usa 'are' para pronombres en plural (we, you, they) y 'is' para singular.",
    minutes: 4,
  },
  "a1-preguntas-do-does": {
    phrase: "Do you speak English?",
    ipa: "/duː juː spiːk ˈɪŋɡlɪʃ/",
    translation: "¿Hablas inglés?",
    explanation: "En preguntas de presente simple usamos 'Do' con I/you/we/they y 'Does' con he/she/it.",
    minutes: 5,
  },
  "a1-there-is-there-are": {
    phrase: "There are two books on the table.",
    ipa: "/ðer ɑːr tuː bʊks ɒn ðə ˈteɪbl/",
    translation: "Hay dos libros sobre la mesa.",
    explanation: "Usa 'there is' para singular o incontable, y 'there are' para sustantivos en plural.",
    minutes: 4,
  },
  "a1-articulos-basicos": {
    phrase: "I bought an apple and a sandwich.",
    ipa: "/aɪ bɔːt ən ˈæpl ænd ə ˈsænwɪdʒ/",
    translation: "Compré una manzana y un sándwich.",
    explanation: "Usa 'an' delante de sonidos vocálicos y 'a' delante de sonidos consonánticos.",
    minutes: 4,
  },
  "a1-can-capacidad-permiso": {
    phrase: "Can you help me with this?",
    ipa: "/kæn juː help miː wɪð ðɪs/",
    translation: "¿Puedes ayudarme con esto?",
    explanation: "El modal 'can' va seguido siempre del verbo en su forma base sin 'to'.",
    minutes: 4,
  },
  "a2-pasado-to-be": {
    phrase: "We were very tired yesterday.",
    ipa: "/wiː wɜːr ˈveri ˈtaɪərd ˈjestərdeɪ/",
    translation: "Estábamos muy cansados ayer.",
    explanation: "El pasado de to be usa 'was' con I/he/she/it y 'were' con you/we/they.",
    minutes: 5,
  },
  "a2-will-going-to": {
    phrase: "I am going to visit my friend tomorrow.",
    ipa: "/aɪ æm ˈɡoʊɪŋ tə ˈvɪzɪt maɪ frend təˈmɔːroʊ/",
    translation: "Voy a visitar a mi amigo mañana.",
    explanation: "Usa 'going to' para intenciones y planes premeditados, y 'will' para decisiones inmediatas.",
    minutes: 5,
  },
  "a2-cuantificadores-esenciales": {
    phrase: "There is too much sugar in this coffee.",
    ipa: "/ðer ɪz tuː mʌtʃ ˈʃʊɡər ɪn ðɪs ˈkɔːfi/",
    translation: "Hay demasiado azúcar en este café.",
    explanation: "Usa 'much' con sustantivos incontables y 'many' con sustantivos contables.",
    minutes: 5,
  },
  "a2-preguntas-indirectas": {
    phrase: "Could you tell me where the station is?",
    ipa: "/kʊd juː tel miː wer ðə ˈsteɪʃn ɪz/",
    translation: "¿Podrías decirme dónde está la estación?",
    explanation: "En preguntas indirectas el orden de las palabras vuelve a ser sujeto + verbo sin inversión.",
    minutes: 6,
  },
  "b1-segundo-condicional": {
    phrase: "If I had more time, I would travel more.",
    ipa: "/ɪf aɪ hæd mɔːr taɪm aɪ wʊd ˈtrævl mɔːr/",
    translation: "Si tuviera más tiempo, viajaría más.",
    explanation: "El segundo condicional usa pasado simple en la condición y 'would + infinitivo' en el resultado.",
    minutes: 6,
  },
  "b1-presente-perfecto-continuo": {
    phrase: "She has been studying since morning.",
    ipa: "/ʃiː hæz biːn ˈstʌdiɪŋ sɪns ˈmɔːrnɪŋ/",
    translation: "Ella ha estado estudiando desde la mañana.",
    explanation: "Usa 'have/has been + -ing' para acciones que empezaron en el pasado y continúan vigentes.",
    minutes: 6,
  },
  "b1-estilo-indirecto": {
    phrase: "He said that he was busy.",
    ipa: "/hiː sed ðæt hiː wəz ˈbɪzi/",
    translation: "Él dijo que estaba ocupado.",
    explanation: "En estilo indirecto, los tiempos verbales suelen dar un paso atrás en el pasado.",
    minutes: 5,
  },
  "b1-gerundios-infinitivos": {
    phrase: "I enjoy reading books in the evening.",
    ipa: "/aɪ ɪnˈdʒɔɪ ˈriːdɪŋ bʊks ɪn ði ˈiːvnɪŋ/",
    translation: "Disfruto leyendo libros por la noche.",
    explanation: "Verbos como 'enjoy', 'avoid' o 'suggest' van seguidos de gerundio (-ing).",
    minutes: 5,
  },
};

/**
 * Returns a rich review example for a lesson slug.
 * Prioritizes canonical authored examples (with IPA and audio); falls back
 * to constructing a readable sentence from the user's failed question feedback.
 */
export function getTopicReviewExample(
  lessonSlug: string,
  fallbackFeedback?: AssessmentQuestionFeedback,
): AssessmentTopicExample {
  const canonical = CANONICAL_TOPIC_EXAMPLES[lessonSlug];
  if (canonical) {
    return canonical;
  }

  if (fallbackFeedback?.prompt) {
    const rawPrompt = fallbackFeedback.prompt;
    const hasBlank = /_{2,}|\.{3}/.test(rawPrompt);
    const completedPhrase = hasBlank && fallbackFeedback.correctAnswer
      ? rawPrompt.replace(/_{2,}|\.{3}/, fallbackFeedback.correctAnswer).trim()
      : rawPrompt;

    return {
      phrase: completedPhrase,
      explanation: fallbackFeedback.explanation,
      minutes: 5,
    };
  }

  return {
    phrase: "Review the key structures and examples for this lesson.",
    minutes: 5,
  };
}
