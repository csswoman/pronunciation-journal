/**
 * Static build artifact for the journal support rail.
 *
 * The generator is intentionally outside the runtime path: this module is the
 * versioned product of prompt_id × CEFR generation. Runtime only resolves it
 * against the learner's word_bank and topic_srs rows.
 */
import { JOURNAL_TOPIC_IDS } from './topic-catalog'

export type ScaffoldSeedWord = {
  text: string
  translation: string
  ipa: string
  example: string
}

export type ScaffoldGrammarNote = {
  topic_id: string
  rule: string
  example_correct: string
  example_wrong: string
}

export interface WritingScaffold {
  prompt_id: string
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  structure: { label: string; hint: string }[]
  sentence_starters: { en: string; es: string }[]
  seed_vocabulary: ScaffoldSeedWord[]
  relevant_topics: string[]
  grammar_notes: ScaffoldGrammarNote[]
}

const fallback = (promptId: string): WritingScaffold => ({
  prompt_id: promptId,
  cefr_level: 'A1',
  structure: [
    { label: 'Empieza', hint: 'Presenta el tema o lo que ocurrió.' },
    { label: 'Desarrolla', hint: 'Añade detalles, explicaciones o sensaciones.' },
    { label: 'Cierra', hint: 'Concluye con tu opinión o lo que aprendiste.' },
  ],
  sentence_starters: [
    { en: 'Today, I want to share that...', es: 'Hoy quiero compartir que...' },
    { en: 'One important thing is...', es: 'Una cosa importante es...' },
    { en: 'In my experience, I noticed...', es: 'En mi experiencia, noté...' },
    { en: 'Looking back, I feel...', es: 'Mirando hacia atrás, siento...' },
  ],
  seed_vocabulary: [
    { text: 'notice', translation: 'notar', ipa: '/ˈnoʊtɪs/', example: 'I noticed a positive change today.' },
    { text: 'experience', translation: 'experiencia', ipa: '/ɪkˈspɪriəns/', example: 'It was a valuable experience for me.' },
    { text: 'because', translation: 'porque', ipa: '/bɪˈkəz/', example: 'I wrote this because it matters.' },
    { text: 'however', translation: 'sin embargo', ipa: '/haʊˈevər/', example: 'However, I learned something new.' },
    { text: 'finally', translation: 'finalmente', ipa: '/ˈfaɪnəli/', example: 'Finally, I reached my goal.' },
    { text: 'realize', translation: 'darse cuenta', ipa: '/ˈriːəlaɪz/', example: 'I realized how much I improved.' },
  ],
  relevant_topics: ['grammar:subject omission', 'grammar:present simple', 'grammar:past simple', 'grammar:articles'],
  grammar_notes: [
    { topic_id: 'grammar:subject omission', rule: 'En inglés el sujeto siempre se escribe (I, it, they, we).', example_correct: 'It is a good day.', example_wrong: 'Is a good day.' },
    { topic_id: 'grammar:past simple', rule: 'Usa pasado simple para acciones y reflexiones de ayer o antes.', example_correct: 'I talked to my friend.', example_wrong: 'I talk to my friend yesterday.' },
    { topic_id: 'grammar:present simple', rule: 'En presente con he, she o it añade -s al verbo.', example_correct: 'She enjoys writing.', example_wrong: 'She enjoy writing.' },
  ],
})

/**
 * Generated scaffolds currently checked in for the four-prompt pool. Each
 * entry follows the v2 contract: six contextual seeds and one note per topic.
 */
export const JOURNAL_WRITING_SCAFFOLDS: Record<string, WritingScaffold> = {
  'small-win': {
    prompt_id: 'small-win',
    cefr_level: 'A1',
    structure: [
      { label: 'Qué pasó', hint: 'Cuenta un logro pequeño y concreto.' },
      { label: 'Cómo lo hiciste', hint: 'Añade una acción o detalle.' },
      { label: 'Por qué importa', hint: 'Explica cómo te hizo sentir.' },
    ],
    sentence_starters: [
      { en: 'One small win I had today was...', es: 'Una pequeña victoria que tuve hoy fue...' },
      { en: 'I managed to...', es: 'Logré...' },
      { en: 'I felt proud because...', es: 'Me sentí orgullosa porque...' },
    ],
    seed_vocabulary: [
      { text: 'manage to', translation: 'lograr', ipa: '/ˈmænɪdʒ tuː/', example: 'I managed to finish my task early.' },
      { text: 'proud', translation: 'orgulloso', ipa: '/praʊd/', example: 'I felt proud after I spoke in English.' },
      { text: 'finish', translation: 'terminar', ipa: '/ˈfɪnɪʃ/', example: 'I finished the report before lunch.' },
      { text: 'effort', translation: 'esfuerzo', ipa: '/ˈefərt/', example: 'My effort made the small win possible.' },
      { text: 'notice', translation: 'notar', ipa: '/ˈnoʊtɪs/', example: 'I noticed that I felt more confident.' },
      { text: 'early', translation: 'temprano', ipa: '/ˈɜːrli/', example: 'I arrived early and had time to prepare.' },
    ],
    relevant_topics: ['grammar:subject omission', 'grammar:past simple', 'grammar:present simple'],
    grammar_notes: [
      { topic_id: 'grammar:subject omission', rule: 'En inglés el sujeto normalmente se expresa.', example_correct: 'I managed to finish early.', example_wrong: 'Managed to finish early.' },
      { topic_id: 'grammar:past simple', rule: 'Usa pasado simple para un logro ya terminado.', example_correct: 'I finished the report.', example_wrong: 'I finish the report yesterday.' },
      { topic_id: 'grammar:present simple', rule: 'Con he, she, it el verbo lleva -s.', example_correct: 'She notices the progress.', example_wrong: 'She notice the progress.' },
    ],
  },
  'learn-this-week': {
    prompt_id: 'learn-this-week',
    cefr_level: 'A1',
    structure: [
      { label: 'Qué quieres aprender', hint: 'Nombra una habilidad concreta.' },
      { label: 'Cómo practicarás', hint: 'Describe un paso pequeño.' },
      { label: 'Para qué te sirve', hint: 'Conecta la habilidad con tu vida.' },
    ],
    sentence_starters: [
      { en: 'This week, I would like to learn...', es: 'Esta semana, me gustaría aprender...' },
      { en: 'I can practice by...', es: 'Puedo practicar al...' },
      { en: 'This will help me...', es: 'Esto me ayudará...' },
    ],
    seed_vocabulary: [
      { text: 'improve', translation: 'mejorar', ipa: '/ɪmˈpruːv/', example: 'I want to improve my listening this week.' },
      { text: 'practice', translation: 'practicar', ipa: '/ˈpræktɪs/', example: 'I can practice for ten minutes each day.' },
      { text: 'goal', translation: 'meta', ipa: '/ɡoʊl/', example: 'My goal is to understand short conversations.' },
      { text: 'habit', translation: 'hábito', ipa: '/ˈhæbɪt/', example: 'A small habit can help me learn.' },
      { text: 'listen', translation: 'escuchar', ipa: '/ˈlɪsən/', example: 'I listen to one short dialogue every morning.' },
      { text: 'remember', translation: 'recordar', ipa: '/rɪˈmembər/', example: 'I write examples to remember new words.' },
    ],
    relevant_topics: ['grammar:subject omission', 'grammar:present simple', 'grammar:articles'],
    grammar_notes: [
      { topic_id: 'grammar:subject omission', rule: 'En inglés el sujeto normalmente se expresa.', example_correct: 'I can practice every day.', example_wrong: 'Can practice every day.' },
      { topic_id: 'grammar:present simple', rule: 'Con he, she, it el verbo lleva -s.', example_correct: 'This habit helps me.', example_wrong: 'This habit help me.' },
      { topic_id: 'grammar:articles', rule: 'Usa a/an para mencionar una cosa por primera vez.', example_correct: 'I have a clear goal.', example_wrong: 'I have clear goal.' },
    ],
  },
  'remembered-conversation': {
    prompt_id: 'remembered-conversation',
    cefr_level: 'A1',
    structure: [
      { label: 'Con quién hablaste', hint: 'Presenta a la persona y el momento.' },
      { label: 'De qué hablaron', hint: 'Recuerda una idea o pregunta.' },
      { label: 'Qué recuerdas', hint: 'Cierra con tu reacción.' },
    ],
    sentence_starters: [
      { en: 'Today, I had a conversation with...', es: 'Hoy tuve una conversación con...' },
      { en: 'We talked about...', es: 'Hablamos sobre...' },
      { en: 'One thing I remember is...', es: 'Una cosa que recuerdo es...' },
    ],
    seed_vocabulary: [
      { text: 'conversation', translation: 'conversación', ipa: '/ˌkɑːnvərˈseɪʃn/', example: 'I had a short conversation with my friend.' },
      { text: 'mention', translation: 'mencionar', ipa: '/ˈmenʃn/', example: 'She mentioned a new project at work.' },
      { text: 'question', translation: 'pregunta', ipa: '/ˈkwestʃən/', example: 'I asked a question about her new course.' },
      { text: 'reply', translation: 'responder', ipa: '/rɪˈplaɪ/', example: 'He replied with a helpful idea.' },
      { text: 'share', translation: 'compartir', ipa: '/ʃer/', example: 'We shared stories about our week.' },
      { text: 'remember', translation: 'recordar', ipa: '/rɪˈmembər/', example: 'I remember the conversation clearly.' },
    ],
    relevant_topics: ['grammar:past simple', 'grammar:subject omission', 'grammar:articles'],
    grammar_notes: [
      { topic_id: 'grammar:past simple', rule: 'Usa pasado simple para una conversación terminada.', example_correct: 'We talked about work.', example_wrong: 'We talk about work yesterday.' },
      { topic_id: 'grammar:subject omission', rule: 'En inglés el sujeto normalmente se expresa.', example_correct: 'She mentioned a new project.', example_wrong: 'Mentioned a new project.' },
      { topic_id: 'grammar:articles', rule: 'Usa a/an para una conversación o idea nueva.', example_correct: 'I asked a question.', example_wrong: 'I asked question.' },
    ],
  },
  'relaxing-place': {
    prompt_id: 'relaxing-place',
    cefr_level: 'A1',
    structure: [
      { label: 'Dónde es', hint: 'Describe el lugar en dos o tres oraciones.' },
      { label: 'Qué haces ahí', hint: 'Cuenta una actividad concreta.' },
      { label: 'Por qué te relaja', hint: 'Explica qué sientes cuando estás ahí.' },
    ],
    sentence_starters: [
      { en: 'The place where I feel calm is...', es: 'El lugar donde me siento tranquila es...' },
      { en: 'When I go there, I usually...', es: 'Cuando voy ahí, normalmente...' },
      { en: 'It helps me because...', es: 'Me ayuda porque...' },
    ],
    seed_vocabulary: [
      { text: 'cozy', translation: 'acogedor', ipa: '/ˈkoʊzi/', example: 'My room feels cozy when it rains.' },
      { text: 'corner', translation: 'rincón', ipa: '/ˈkɔːrnər/', example: 'I read in the corner near the window.' },
      { text: 'quiet', translation: 'silencioso', ipa: '/ˈkwaɪət/', example: 'The house is quiet in the morning.' },
      { text: 'blanket', translation: 'manta', ipa: '/ˈblæŋkɪt/', example: 'I keep a blanket on the sofa.' },
      { text: 'shelf', translation: 'estante', ipa: '/ʃelf/', example: 'There is a shelf with my favorite books.' },
      { text: 'calm down', translation: 'calmarse', ipa: '/kɑːm daʊn/', example: 'I go there when I need to calm down.' },
    ],
    relevant_topics: ['grammar:subject omission', 'grammar:articles', 'grammar:present simple'],
    grammar_notes: [
      { topic_id: 'grammar:subject omission', rule: 'En inglés el sujeto nunca se omite.', example_correct: 'It is quiet in the morning.', example_wrong: 'Is quiet in the morning.' },
      { topic_id: 'grammar:articles', rule: "No uses 'the' cuando hablas de algo en general.", example_correct: 'I like quiet places.', example_wrong: 'I like the quiet places.' },
      { topic_id: 'grammar:present simple', rule: 'Con he, she, it el verbo lleva -s en presente.', example_correct: 'The room feels warm.', example_wrong: 'The room feel warm.' },
    ],
  },
}

export function writingScaffoldFor(promptId: string, cefrLevel: WritingScaffold['cefr_level'] = 'A1'): WritingScaffold {
  const scaffold = JOURNAL_WRITING_SCAFFOLDS[promptId]
  if (!scaffold) return fallback(promptId)
  const relevantTopics = scaffold.relevant_topics.filter((topicId) => JOURNAL_TOPIC_IDS.has(topicId))
  const grammarNotes = scaffold.grammar_notes.filter((note) => relevantTopics.includes(note.topic_id))
  return {
    ...scaffold,
    cefr_level: scaffold.cefr_level === cefrLevel ? scaffold.cefr_level : cefrLevel,
    relevant_topics: relevantTopics,
    grammar_notes: grammarNotes,
  }
}
