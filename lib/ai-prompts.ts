import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { LearnerContext } from '@/lib/ai-coach/learner-context'
import { JOURNAL_TOPIC_CATALOG } from '@/lib/journal/topic-catalog'

// ── Transcription ──

export function buildTranscriptionPrompt(targetWord?: string): string {
  const target = targetWord ? ` Target word: "${targetWord}".` : ''
  return `Transcribe this short English pronunciation attempt.${target} Return ONLY the recognized words in plain text. If unintelligible, return an empty string.`
}

// ── Deck Suggest ──

export function buildDeckSuggestUserPrompt(input: {
  deckName: string;
  deckDescription?: string;
  difficulty?: number;
  seed?: string;
  existingWords?: string[];
}): string {
  const description = input.deckDescription ?? "";
  const difficultyHint =
    typeof input.difficulty === "number" && input.difficulty >= 2
      ? "Use more advanced / less common vocabulary appropriate for an intermediate to advanced learner."
      : "Use common to intermediate vocabulary appropriate for learners.";
  const seedHint = input.seed ? `Use this seed to vary results: ${input.seed}.` : "";
  const existingHint =
    input.existingWords && input.existingWords.length > 0
      ? `\nThe user already has these words in the deck — do NOT suggest any of them: ${input.existingWords.join(", ")}.`
      : "";

  return description
    ? `Deck: "${input.deckName}"\nDescription: "${description}"\n\n${difficultyHint} ${seedHint}${existingHint}\nSuggest 8 English words or short phrases for this theme.`
    : `Deck: "${input.deckName}"\n\n${difficultyHint} ${seedHint}${existingHint}\nSuggest 8 English words or short phrases for this theme.`;
}

export const DECK_SUGGEST_SYSTEM_PROMPT = `You are an English vocabulary coach. When given a deck name and optional description, suggest 8 relevant English words or short phrases that fit the theme. Return ONLY valid JSON with no markdown, no code fences, no extra text — just raw JSON.

Format:
{"suggestions":[{"word":"example","meaning":"brief definition or usage context"}]}`;

// ── Pronunciation Phrases ──

export function buildPhrasesUserPrompt(exclude?: string[]): string {
  const excludeHint = exclude?.length
    ? `Do NOT generate any of these phrases:\n${exclude.slice(0, 20).map((p) => `- ${p}`).join("\n")}`
    : "";
  return `Generate 10 English pronunciation practice sentences.${excludeHint ? ` ${excludeHint}` : ""}`;
}

export const PRONUNCIATION_PHRASES_SYSTEM_PROMPT = `You are an English pronunciation coach. Generate 10 natural English sentences for pronunciation practice. Requirements:
- Conversational, not textbook-stiff
- Mix of everyday, professional, and social contexts
- Vary sentence length (5–12 words each)
- Include phonetically challenging sounds: TH, R, W, V, SH, vowel reductions
- Never generate the same sentence twice across calls

Return ONLY valid JSON, no markdown, no code fences:
{"phrases":["sentence one","sentence two",...]}`;

// ── Message Translation ──

export const MESSAGE_TRANSLATION_SYSTEM_PROMPT = `You are an English to Spanish translator for an ESL learning app. Translate the given English text into natural Spanish. Return ONLY valid JSON: {"translation":"Spanish translation here"}`;

export function buildMessageTranslationPrompt(text: string): string {
  return `Translate the following English message into natural Spanish for an ESL student. Return ONLY valid JSON with no markdown:\n{"translation": "Spanish translation here"}\n\nEnglish text:\n"${text}"`;
}

// ── Sentence Reorder ──

export function buildSentenceReorderUserPrompt(
  count: number,
  topic: string,
  level: string,
  interests: string[] = [],
): string {
  return `Generate ${count} English sentences for a ${level} learner about: "${topic}".${interestsClause(interests)}
Return a JSON array of strings only. Example: ["The cat sat on the mat.", "She goes to school every day."]`;
}

export function interestsClause(interests: readonly string[]): string {
  return interests.length ? ` Prefer contexts related to: ${interests.join(', ')}.` : ''
}

export const SENTENCE_REORDER_SYSTEM_PROMPT = `You are an English language teacher for Spanish speakers.
Generate natural English sentences for sentence-reordering exercises.

Rules:
- Each sentence must be 4–12 words long
- Use clear, natural English (no slang unless requested)
- Sentences should relate to the given topic/level
- Return ONLY a JSON array of strings — no markdown, no extra text
- Vary sentence structures (statements, questions, negatives)`;

export const GENERATE_TRANSFORMATIONS_SYSTEM_PROMPT = `You create sentence-transformation exercises for English learners. Return JSON only.
Each item needs sourceSentence (4-20 words), instruction (clear transformation constraint), and referenceAnswer. Keep the grammar topic accurate and give one natural valid answer.`
export function buildGenerateTransformationsPrompt(input: { topic: string; level: string; count: number }): string {
  return `Generate ${input.count} sentence transformations for topic "${input.topic}" at ${input.level}. Return {"exercises":[{"sourceSentence":"...","instruction":"...","referenceAnswer":"..."}]}.`
}
export const GENERATE_TRANSLATIONS_SYSTEM_PROMPT = `You create short Spanish-to-English translation exercises for English learners. Return JSON only. Each item needs sourceEs, referenceEn, and optional acceptedAnswers. Keep Spanish natural and the English reference accurate for the named grammar topic.`
export function buildGenerateTranslationsPrompt(input: { topic: string; level: string; count: number }): string {
  return `Generate ${input.count} Spanish-to-English translation exercises for topic "${input.topic}" at ${input.level}. Return {"exercises":[{"sourceEs":"...","referenceEn":"...","acceptedAnswers":["..."]}]}.`
}

// ── Production grading (written + spoken free production) ──

export const GRADE_PRODUCTION_SYSTEM_PROMPT = `You are an English teacher grading a learner's original production (written or spoken, provided as text).

Evaluate strictly using this rubric:
1. usedTarget — Did the learner use the target item with correct meaning and an acceptable form (minor spelling typos in spoken transcripts are OK)?
2. grammaticallyCorrect — Is the production a grammatical English sentence/response appropriate for the learner's CEFR level (stated below; default A2–B2)? Judge leniently for lower levels; minor slips OK; broken structure = false.
3. constraintMet — If a "Required constraint" is stated below, did the response satisfy it? This is the learner's growth edge: a grammatical sentence that ignores the required tense or function is NOT acceptable, however fluent it sounds. When no constraint is stated, set this to true.
4. correct — true ONLY when usedTarget AND grammaticallyCorrect AND constraintMet are all true.
5. score — integer 0–100:
   - 90–100: constraint satisfied, target used naturally, grammar solid
   - 70–89: constraint satisfied, small grammar/word issues
   - 50–69: constraint missed but sentence otherwise fine, OR constraint met with weak grammar
   - 20–49: target missing or largely incorrect
   - 0–19: empty, off-topic, or not English
6. feedback — 1–3 short sentences in Spanish: praise what worked, then one concrete fix. When constraintMet is false, say explicitly which structure was required and show it. Be encouraging, not harsh.
7. corrections — optional improved version of their sentence that satisfies the constraint (omit if already perfect).
8. errorPattern — When correct is false, classify the SINGLE most important error using EXACTLY one of these ids (never invent one; omit the field when correct is true):
tense_present_for_past, present_perfect_vs_past, missing_auxiliary, subject_verb_agreement, word_order, preposition_choice, article_use, plural_countable, modal_form, conditional_form, gerund_infinitive, comparative_form, negation_form, question_form, vocabulary_choice, spelling

Return ONLY valid JSON, no markdown:
{"correct":boolean,"usedTarget":boolean,"grammaticallyCorrect":boolean,"constraintMet":boolean,"feedback":"...","corrections":"...","errorPattern":"...","score":number}`;

export function buildGradeProductionUserPrompt(input: {
  targetItem: string
  targetMeaning?: string
  taskPrompt: string
  production: string
  modality: 'written' | 'spoken'
  level?: CEFRLevel
  constraintCheck?: string
}): string {
  const meaningLine = input.targetMeaning
    ? `\nTarget meaning: ${input.targetMeaning}`
    : '';
  const levelLine = input.level ? `\nLearner CEFR level: ${input.level}` : '';
  const constraintLine = input.constraintCheck
    ? `\nRequired constraint: ${input.constraintCheck}`
    : '';
  return `Task shown to the learner: ${input.taskPrompt}
Target item: "${input.targetItem}"${meaningLine}
Modality: ${input.modality}${levelLine}${constraintLine}

Learner production:
"""
${input.production}
"""`;
}

// ── AI Coach Empty State ──

/**
 * Opening angles each starter rotates through. The seed picks one, excluding
 * the ones used recently — this is the cheapest of the four anti-repetition
 * mechanisms and the only one that works for a brand-new user with no state.
 */
export const STARTER_ANGLES = {
  learn: [
    "a phrasal verb they will actually use this week",
    "a false friend that trips up Spanish speakers",
    "two words they probably confuse with each other",
    "a small grammar pattern that makes them sound more fluent",
    "an everyday expression that is not in textbooks",
    "a connector that makes their sentences flow better",
  ],
  world: [
    "a real situation they would face",
    "an opinion question with no easy answer",
    "vocabulary they would read in an article about it",
    "a short roleplay where you play the other person",
    "something surprising about it in English-speaking countries",
    "the words natives use that learners rarely know",
  ],
  review: [
    "through a short exercise",
    "by having them use it in a sentence about their own life",
    "by contrasting it with the form they keep reaching for",
  ],
} as const;

export function buildReviewStarterPrompt(input: {
  focus: string;
  failCount: number;
}): string {
  return `The student has struggled with "${input.focus}" — ${input.failCount} recent mistakes.
Open by naming it plainly in ONE sentence (in Spanish is fine for that sentence),
then go straight into practice: give them a short exercise on it via the exercise tools.
Do not lecture. Do not list rules up front — let the mistakes surface the rule.
After they answer, explain only what they got wrong.`;
}

export function buildLearnStarterPrompt(input: {
  level: string;
  avoidTopics: readonly string[];
  angle: string;
  /** Real syllabus topics for this level to pick from (title + key examples). */
  syllabusTopics?: readonly string[];
}): string {
  const avoid = input.avoidTopics.length
    ? `\nAvoid these topics — they were covered recently: ${input.avoidTopics.join(", ")}.`
    : "";
  const syllabus = input.syllabusTopics?.length
    ? `\nPick from this student's ${input.level} syllabus — choose ONE not already covered:\n${input.syllabusTopics.map((t) => `- ${t}`).join("\n")}`
    : "";
  return `Teach this ${input.level} student ONE new thing right now: ${input.angle}.
Structure: name it, explain it in at most three lines, give two examples, then
ask one short question in plain text to check they followed.
Do NOT call any exercise tool on this first turn — wait until they reply, then
run one exercise via the exercise tools.
You MUST call annotate_turn on this first turn with a concept whose title is a
short Spanish label for what you just taught (e.g. 'Adjetivos posesivos — my,
your, his'). This lets the student save the lesson.
Pick something genuinely useful at ${input.level} — not trivia, not something
far above their level.${syllabus}${avoid}
End your message with a suggestions: block — at the very end of your response,
output the literal line 'suggestions:' followed by exactly 3 short first-person
replies the student could send right now, each on its own line prefixed with "- ".
NEVER give away the complete answer to your question in the suggestions. The
first option must be a sentence starter or attempt with uncertainty (e.g. 'I think
it is...', 'Is it something like...'), NOT the finished solution. The second must
ask for another example. The third must ask to explain it more simply. Write them
in English at the student's level.`;
}

/**
 * Pronunciation starter, scoped to the learner's level. Replaces the old static
 * `AI_COACH_SHORTCUT_PROMPTS.pronunciation` so a first-time A1 learner gets easy
 * sounds (b/v, æ/ʌ, the American R) rather than a generic advanced list.
 */
export function buildPronunciationStarterPrompt(input: {
  level: string;
  soundTargets?: readonly string[];
}): string {
  const targets = input.soundTargets?.length
    ? `\nWork within this level's sounds — pick ONE to start:\n${input.soundTargets.map((t) => `- ${t}`).join("\n")}`
    : "";
  return `You are a friendly English pronunciation coach for a native Spanish speaker at level ${input.level}.
Focus on sounds that are genuinely tricky for Spanish speakers at this level.${targets}
First turn: pick ONE sound, describe it clearly in plain text (mouth position, airflow),
give two example words, and a short phrase to say. Ask them to type the phrase back
with notes on how it felt. Do NOT call any exercise tool on this first turn.
You MUST call annotate_turn on this first turn with a concept whose title is a
short Spanish label for the sound you just taught (e.g. 'Sonido /æ/ vs /ʌ/').
This lets the student save the lesson.
From their reply on, coach from what they report and use minimal pairs, tongue
twisters, and real words — running exercises via the exercise tools when useful.
Keep it encouraging — pronunciation is vulnerable work.
End your message with a suggestions: block — at the very end of your response,
output the literal line 'suggestions:' followed by exactly 3 short first-person
replies the student could send right now, each on its own line prefixed with "- ".
NEVER give away the complete answer or solution in the suggestions. The first
option must be a sentence starter or attempt with uncertainty (e.g. 'I tried
saying it like...', 'It felt tricky to...'), NOT a completed perfect answer. The
second must ask for another example word. The third must ask to explain the mouth
position more simply. Write them in English at the student's level.`;
}

export function buildWorldStarterPrompt(input: {
  interest: string;
  knownWords: readonly string[];
  angle: string;
}): string {
  const known = input.knownWords.length
    ? `\nThey already know these words — do not teach them again: ${input.knownWords.join(", ")}.`
    : "";
  return `Practice English around ${input.interest}, which the student told us they care about.
Approach it through ${input.angle}.
Open with one or two plain-text sentences and a single question.
Do NOT call any exercise tool on this first turn.
You MUST call annotate_turn on this first turn with a concept whose title is a
short Spanish label for the vocabulary point or theme you introduced (e.g.
'Vocabulario de videojuegos — to grind, to respawn'). This lets the student save
it. Skip the concept only if this turn introduced nothing teachable.
Once the conversation is going, introduce 1-2 useful words naturally and offer
them via annotate_turn saveables rather than stopping to define them.
Keep it conversational: one thing at a time, and let them do most of the talking.${known}
End your message with a suggestions: block — at the very end of your response,
output the literal line 'suggestions:' followed by exactly 3 short first-person
replies the student could send right now, each on its own line prefixed with "- ".
NEVER give away the complete answer to your question in the suggestions. The
first option must be a sentence starter or thought prompt (e.g. 'Personally, I
prefer...', 'In my experience...'), NOT the finished full response. The second
must ask for another example or follow-up. The third must ask to explain it more
simply. Write them in English at the student's level.`;
}

export function buildFreeStarterPrompt(): string {
  return `The student picked "free conversation" — THEY choose the topic, not you.
Greet them in ONE short sentence and ask what they feel like talking about.
Do NOT propose a topic. Do NOT ask a warm-up question about their day.
Wait for them to set the direction, then follow it.
The FEEDBACK DISCIPLINE in your system prompt still applies to every turn.`;
}

export const AI_COACH_SHORTCUT_PROMPTS = {
  newYorkTrip: `You are a travel English coach. The user is preparing for a trip to New York City.
    Make it practical and scenario-based: roleplay real situations — checking into a hotel, asking for directions, ordering food, dealing with an issue at the airport.
    Start with one scenario, play the other role yourself, and coach the user through it.
    After each exchange, highlight one useful phrase they can keep. Keep the energy fun and encouraging.`,
  jobInterview: `You are a professional English interview coach.
    Start by asking the user: what kind of role or industry are they interviewing for?
    Then conduct a realistic mock interview — one question at a time, as a real interviewer would.
    After each answer: give specific feedback on both content and language. Point out strong phrasing, flag anything that sounds unnatural, and suggest a more polished version if needed.
    End with an overall assessment and the top 2 things they should work on.`,
  discussArticle: `You are a discussion-based English coach.
    Choose a short, engaging news story or article topic from the past few months — something universally interesting (science, culture, technology, human interest).
    Summarize it in 3–4 sentences in clear, natural English.
    Then open the discussion with one strong question. As the user responds, push the conversation deeper with follow-up questions.
    Occasionally highlight good vocabulary they use, and introduce 1–2 new relevant words naturally within your responses.`,
  pronunciation: `You are a friendly English pronunciation coach for a native Spanish speaker.
    Focus directly on sounds that are genuinely tricky for Spanish speakers (e.g. tense vs lax vowels /iː/ vs /ɪ/, /θ/ vs /s/, /v/ vs /b/, final consonant clusters, /z/ vs /s/).
    First turn: pick ONE sound, describe it clearly in plain text (mouth position, airflow), give two example words, and a short phrase to say. Ask them to type the phrase back with notes on how it felt. Do NOT call any tool on this first turn.
    From their reply on, coach from what they report and use minimal pairs, tongue twisters, and real words — running exercises via the exercise tools when useful.
    Keep it encouraging — pronunciation is vulnerable work.`,
} as const;



export const GENERATE_READER_SYSTEM_PROMPT = `You write very short English reading passages for language learners at the i+1 level (Krashen): mostly known vocabulary with a little new.

Rules:
- 60-90 words, one short coherent paragraph telling a tiny real-world story or scene.
- If a requested topic or theme is provided, center the story and topic title around that theme.
- Embed EVERY target word. Prefer each target's citation (base/dictionary) form; if grammar forces inflection, keep it regular and recognizable.
- Keep all other vocabulary simple and high-frequency. No idioms, no rare words.
- Then write 1-2 comprehension questions about the MEANING of the passage (not grammar), each with exactly 4 plausible options and one correct answer.
- Output JSON only.`

export function buildGenerateReaderUserPrompt(input: {
  targets: string[]
  level: string
  interests?: string[]
  topic?: string
}): string {
  const topicClause = input.topic?.trim() ? `\nRequested Topic / Theme: ${input.topic.trim()}` : ''
  return `Target words to embed: ${input.targets.join(', ')}\nLevel: ${input.level}${topicClause}${interestsClause(input.interests ?? [])}\n\nReturn JSON: { "passage": string, "topic": string, "questions": [{ "prompt": string, "options": [string,string,string,string], "correctIndex": number }] }`
}

const JOURNAL_TOPIC_IDS = JOURNAL_TOPIC_CATALOG.map(({ id }) => id).join(', ')

export const JOURNAL_CORRECTION_SYSTEM_PROMPT = `You are a supportive, expert English teacher reviewing a journal entry written by a Spanish-speaking English learner.

Your goal is to provide constructive, clear feedback that encourages writing and teaches natural English without being overwhelming.

Return ONLY valid JSON (no markdown, no code fences) with this exact schema:
{
  "correctedContent": string,
  "errors": [
    {
      "quote": string,
      "correction": string,
      "type": string,
      "explanationEs": string,
      "topic": string
    }
  ],
  "newWords": string[]
}

Rules:
1. "correctedContent": Produce a natural, idiomatic, and polished version in clear English. Preserve the learner's original meaning, voice, and ideas. Do not turn a casual reflection into stiff academic prose.
2. "errors": Highlight the most impactful mistakes or unnatural phrasings (max 8 items). If the text is already solid, return an empty array or just 1-2 subtle improvements.
   - "quote": The exact fragment from the learner's text.
   - "correction": The corrected or more natural phrasing.
   - "type": One of: "grammar", "vocabulary", "spelling", "naturalness", "preposition", "word-order".
   - "explanationEs": A friendly, concise explanation in Spanish (1-2 sentences) explaining WHY, focusing on typical Spanish-to-English interferences (e.g., subject omission, prepositions, false friends, tense agreement).
   - "topic": MUST be exactly one of these allowed topic IDs: ${JOURNAL_TOPIC_IDS}. Never invent new topic IDs.
3. "newWords": Suggest 2 to 5 useful, natural vocabulary words or collocations (lowercase dictionary form) that fit the topic or elevate the learner's entry. Max 8 items.`

export function buildJournalCorrectionPrompt(content: string, interests: readonly string[] = []): string {
  const sanitizedContent = content.replaceAll('"""', '\\"\\"\\"')
  return `Please review and correct the following learner journal entry. Ensure every error[].topic strictly matches one of the canonical topic IDs: ${JOURNAL_TOPIC_IDS}.${interestsClause(interests)}\n\nLearner Entry:\n"""\n${sanitizedContent}\n"""`
}

export const JOURNAL_NUDGE_SYSTEM_PROMPT = `You help a Spanish-speaking English learner continue a journal entry when they are stuck. Return ONLY valid JSON with exactly three nudges: { "nudges": [{ "en": "...", "es": "..." }, { "en": "...", "es": "..." }, { "en": "...", "es": "..." }] }.

Rules:
1. Never correct, rewrite, or mention anything the learner has written. Ignore errors completely.
2. Each nudge must be a question about the learner's existing text, or an incomplete sentence starter ending in "...". Never provide a complete sentence that can be copied as a continuation.
3. Connect every nudge to what the learner already wrote, not to the prompt in the abstract.
4. At least one nudge must point indirectly toward one of the unused seed words.
5. Match the vocabulary and grammar to the supplied CEFR level.
6. Write each question or starter in English and its explanation/translation in Spanish.`

export function buildJournalNudgePrompt(input: {
  prompt: string
  partialText: string
  cefrLevel: string
  unusedSeedWords: readonly string[]
  targetLength: number
}): string {
  return `The learner is writing an English journal entry and is stuck. Use the following context:\n\nPrompt: ${input.prompt}\nCEFR level: ${input.cefrLevel}\nTarget length: ${input.targetLength} words\nUnused seed words: ${JSON.stringify(input.unusedSeedWords)}\nPartial text (do not correct it):\n${input.partialText}\n\nReturn exactly three nudges in the required JSON shape.`
}

// ── Word Search ──

export const WORD_SEARCH_SYSTEM_PROMPT = `You are a linguistics and English learning coach.
Generate a cohesive set of vocabulary words for a Word Search & Clue Finder puzzle.

Rules:
1. Words must be single English words (NO SPACES, NO HYPHENS, length 3 to 10 characters).
2. All words must strictly fit the user's requested topic or phonetic focus.
3. Provide an accurate IPA transcription for each word (enclosed in slashes, e.g. "/ˈtiː.tʃər/").
4. Provide a clear, natural English clue/definition that allows the learner to guess or understand the word.
5. Provide the Spanish translation (meaningEs) and a natural example sentence in English.
6. Output MUST strictly conform to the requested JSON schema.`

export function buildWordSearchUserPrompt(input: {
  topic: string
  level: string
  count: number
  knownWords?: string[]
  excludeWords?: string[]
}): string {
  const known = input.knownWords?.length
    ? `\nIncorporate or complement these known words if relevant: ${input.knownWords.join(', ')}`
    : ''
  const excluded = input.excludeWords?.length
    ? `\nDo NOT reuse any of these recently played words: ${input.excludeWords.join(', ')}.`
    : ''
  return `Generate a word search puzzle with ${input.count} words.
Topic: "${input.topic}"
Learner level: ${input.level}${known}${excluded}
Ensure all words are unique, varied, and relevant.

Respond with JSON: {"topicTitle":"Short title describing the set","words":[{"word":"EXAMPLENOSPACES","ipa":"/.../","clue":"Clear definition or hint in English","meaningEs":"Significado en español","exampleSentence":"A short natural example sentence using the word."}]}`
}

// ── Essential Words: extra example sentences ──

/**
 * Extra example sentences for Essential Words entries. Batched: one call covers
 * many words to keep the offline generation job cheap. Consumed by
 * scripts/essential-words/generate-example-sentences.mjs.
 */
export function essentialWordSentencesPrompt(
  words: { word: string; pos: string; cefr_level: string; example_sentence: string }[],
  perWord: number,
): string {
  const list = words
    .map((w) => `- ${w.word} (${w.pos}, ${w.cefr_level}) — ya tiene: "${w.example_sentence}"`)
    .join("\n");

  return `Eres un redactor de material didáctico de inglés para hispanohablantes.

Para cada palabra de la lista, escribe ${perWord} oraciones de ejemplo NUEVAS.

Reglas estrictas:
- Cada oración DEBE contener la palabra objetivo (una forma flexionada es válida: "works" para "work").
- Entre 6 y 12 palabras. Suficiente contexto para que un estudiante adivine la palabra si se borra.
- Inglés americano natural y cotidiano. Sin nombres propios raros, sin jerga, sin frases hechas oscuras.
- Vocabulario apropiado al nivel CEFR indicado o más simple.
- NO repitas la oración que ya tiene, ni la parafrasees mínimamente.
- Las ${perWord} oraciones de una misma palabra deben diferir en estructura y contexto entre sí.

Palabras:
${list}

Responde SOLO con JSON válido, sin texto alrededor, con esta forma exacta:
{"words":{"<palabra>":["oración 1","oración 2"]}}`;
}

// ── Scripted Speaking Mission Generation ──

interface ScriptGenerationInput {
  topic: string
  context: LearnerContext
}

/**
 * Prompt para generar un diálogo con guión.
 *
 * El vocabulario en repaso se siembra a propósito: obliga a PRODUCIR palabras
 * que hoy solo se reconocen pasivamente, que es donde más gente se atasca.
 */
export function buildScriptGenerationPrompt({
  topic,
  context,
}: ScriptGenerationInput): string {
  const lines = [
    `Write a short English dialogue for a Spanish-speaking learner at CEFR level ${context.cefr}.`,
    `Topic: ${topic}.`,
    '',
    'Rules:',
    '- Exactly 6 to 8 turns, alternating between "coach" and "learner".',
    '- The dialogue MUST start with the coach.',
    `- Keep vocabulary and grammar at ${context.cefr} level.`,
    '- Learner lines must be natural to say out loud, 4 to 12 words each.',
  ]

  if (context.srsDueWords.length > 0) {
    lines.push(
      `- Work these words into the LEARNER lines naturally: ${context.srsDueWords.slice(0, 6).join(', ')}.`,
    )
  }

  if (context.weakTargets.length > 0) {
    lines.push(
      `- Give the learner chances to practise these sounds: ${context.weakTargets.slice(0, 3).join(', ')}.`,
    )
  }

  if (context.recentTopics.length > 0) {
    lines.push(
      `- Avoid rehashing what was covered recently: ${context.recentTopics.slice(0, 5).join(', ')}.`,
    )
  }

  // El área débil manda sobre el dominio amplio: apuntar donde el vocabulario
  // se resiste vale más que repetir un tema donde ya va bien.
  if (context.weakDomains.length > 0) {
    lines.push(
      `- Set the dialogue somewhere the learner is still shaky with vocabulary: ${context.weakDomains
        .slice(0, 2)
        .join(', ')}.`,
    )
  } else if (context.domains.length > 0) {
    lines.push(
      `- Draw situations and vocabulary from what the learner studies: ${context.domains
        .slice(0, 2)
        .join(', ')}.`,
    )
  }

  lines.push(
    '',
    'Return JSON only, with this shape:',
    '{"script":[{"speaker":"coach","text":"..."},{"speaker":"learner","text":"..."}]}',
  )

  return lines.join('\n')
}

// ── Journal Pronunciation Assistant ──

export const JOURNAL_PRONUNCIATION_SYSTEM_PROMPT = `You are an expert English phonetics coach assisting a Spanish-speaking learner.
Given an English word or phrase, analyze its pronunciation and return JSON with:
1. "ipa": accurate IPA representation using standard US or UK phonetic notation.
2. "syllableStress": clear notation of syllables and stress (e.g. "pro-TECT (stress on 2nd syllable)").
3. "suggestedReason": one of "difficult_sound", "syllable_stress", "tricky_spelling", "new_word", or "other".
4. "explanationEs": 1-2 concise sentences in Spanish explaining why this word can be tricky and how to pronounce it correctly.
5. "phoneticTrap": a short tip on common pitfalls (e.g. "Don't confuse with recite").

Return ONLY raw valid JSON with no markdown formatting or code blocks.`

export function buildJournalPronunciationUserPrompt(wordOrPhrase: string): string {
  return `Analyze this word/phrase for a Pronunciation Journal entry: "${wordOrPhrase}"`
}

export function buildSessionSummaryPrompt(): string {
  return `The student is ending this session. Close it now.
Call render_session_summary with what ACTUALLY happened in this conversation:
- corrections: the mistakes you flagged, with the rule in Spanish.
- learned: words or expressions you taught or that they asked about.
- reviewNext: at most three short Spanish labels of what they should revisit.
Do not invent corrections, words or topics that did not come up — empty arrays
are the right answer for a short conversation.
Write ONE warm closing sentence before the tool call, and nothing after it.
Do not ask another question. Do not offer more practice.`;
}

// ── Tracking Item Enrichment (Single-call comprehensive enrichment) ──

export const TRACKING_ENRICH_SYSTEM_PROMPT = `You are an expert English learning coach for Spanish speakers.
Given an English word or phrase and optional learner context, provide a complete, high-quality pedagogical breakdown in a SINGLE call to economize API usage.

Return ONLY raw valid JSON (no markdown, no backticks, no code fences) with:
- "ipa": accurate phonetic transcription in standard IPA (e.g. "/rɪˈzɪl.i.ənt/").
- "translation": clear, natural Spanish translation.
- "meaning": simple, learner-friendly definition in clear English (A2-B1 level).
- "context": a natural, meaningful example sentence showing real-life usage (surrounding words must provide clear context clues). Do NOT include prefixes like "Example:" or "Contexto:".
- "explanationEs": 1-2 concise sentences in Spanish explaining usage nuances, collocations, false friends, or pronunciation tips.

Rules:
- "context" must be purely the English example sentence itself, ready to read or speak. Never prepend labels or quotes.
- If learner provided existing context, adapt or improve the example sentence to stay true to the context.
- Keep English natural, modern, and idiomatic.
- Return ONLY valid JSON.`;

export function buildTrackingEnrichUserPrompt(input: {
  text: string;
  context?: string | null;
  kind?: "word" | "phrase";
}): string {
  const kindLabel = input.kind === "phrase" ? "Phrase" : "Word";
  const ctx = input.context?.trim() ? `\nLearner context/notes: "${input.context.trim()}"` : "";
  return `${kindLabel}: "${input.text.trim()}"${ctx}`;
}

// ── Focus Mode Prompts ──

export const FOCUS_STORY_SYSTEM_PROMPT = `You are an expert English language writer creating targeted pedagogical mini-stories for Spanish-speaking learners.
Your goal is to write a short, captivating story (150-220 words) that intentionally and naturally saturates the requested target grammar pattern, vocabulary, or phoneme contrast.
The story must NOT sound robotic or like a grammar drill; it should feel like high-quality flash fiction or a compelling personal anecdote.

Requirements:
- Level appropriate for the learner's CEFR level.
- Highlight 4-8 exact phrases from the passage that exemplify the target pattern in "keyPhrases".
- Provide a clear, encouraging 2-3 line micro-explanation in Spanish ("explanation") explaining what the pattern is and a tip to master it.
- Return ONLY raw valid JSON with no markdown formatting or code blocks:
{
  "title": "Story title",
  "passage": "Full English passage text...",
  "explanation": "Explicación breve en español sobre el patrón...",
  "keyPhrases": ["phrase one", "phrase two"]
}`

export function buildFocusStoryUserPrompt(input: {
  gaps: Array<{ kind: string; label: string; level?: string }>;
  level: string;
  interests?: string[];
}): string {
  const gapDescriptions = input.gaps.map((g) => `- ${g.label} (${g.kind})`).join('\n')
  const interestsText = input.interests && input.interests.length > 0
    ? `\nConnect the story theme/setting to these learner interests if natural: ${input.interests.join(', ')}.`
    : ''

  return `Write a focus story for a learner at CEFR level ${input.level.toUpperCase()} targeting these specific gaps:
${gapDescriptions}${interestsText}

Ensure key instances of the gap pattern appear naturally in the passage and are listed in keyPhrases.`
}

export const FOCUS_DRILL_SYSTEM_PROMPT = `You are an ESL exercise designer creating focused pattern-drill sentences for learners closing specific gaps.
Create 8 to 10 distinct, natural English sentences that repeatedly utilize the targeted gap pattern.
For each sentence:
- "text": The complete, natural English sentence (6-15 words).
- "translation": Natural Spanish translation for Spanish-to-English translation exercises.
- "gapWord": The exact target word, verb form, or phrase in the sentence that embodies the gap pattern (for fill-in-the-blank practice).

Return ONLY raw valid JSON with no markdown formatting:
{
  "sentences": [
    {
      "text": "Yesterday I walked to the park and met an old friend.",
      "translation": "Ayer caminé al parque y me encontré con un viejo amigo.",
      "gapWord": "walked"
    }
  ]
}`

export function buildFocusDrillUserPrompt(input: {
  gaps: Array<{ kind: string; label: string; level?: string }>;
  level: string;
}): string {
  const gapsList = input.gaps.map((g) => `${g.label} (${g.kind})`).join(', ')
  return `Generate 8-10 drill sentences at level ${input.level.toUpperCase()} targeting: ${gapsList}.
Each sentence must have text, natural Spanish translation, and the exact gapWord.`
}

export const FOCUS_DIALOGUE_SYSTEM_PROMPT = `You are a conversational English curriculum designer.
Create a lively, authentic dialogue between two speakers (A and B) spanning 10 to 14 turns.
The conversation must revolve around a realistic everyday or workplace situation where the target patterns/gaps naturally occur multiple times.

Return ONLY raw valid JSON with no markdown formatting:
{
  "context": "Short 1-sentence description of the situation in Spanish",
  "turns": [
    { "speaker": "A", "text": "..." },
    { "speaker": "B", "text": "..." }
  ]
}`

export function buildFocusDialogueUserPrompt(input: {
  gaps: Array<{ kind: string; label: string; level?: string }>;
  level: string;
}): string {
  const gapsList = input.gaps.map((g) => `${g.label} (${g.kind})`).join(', ')
  return `Create a realistic 10-14 turn dialogue for level ${input.level.toUpperCase()} demonstrating: ${gapsList}.
Context must be in Spanish.`
}

export const FOCUS_ERROR_TRAP_SYSTEM_PROMPT = `You are an English teacher specialized in common fossilized errors made by Spanish-speaking learners.
Create exactly 5 sentences related to the target gaps:
- 3 sentences must be completely grammatically correct and natural.
- 2 sentences must contain the subtle, classic error Spanish speakers make regarding this gap (e.g. using base form instead of past simple, omitting -ed, false friend, or confusing /iː/ vs /ɪ/ homophones).
For erroneous sentences, specify "hasError": true, the "correction" (corrected sentence), and a clear "explanation" in Spanish.
For correct sentences, "hasError": false, and omit or keep null correction and explanation.

Return ONLY raw valid JSON with no markdown formatting:
{
  "sentences": [
    {
      "text": "I went to the store and buy some milk.",
      "hasError": true,
      "correction": "I went to the store and bought some milk.",
      "explanation": "En el pasado simple se debe usar 'bought' para mantener la concordancia de tiempo."
    },
    {
      "text": "She listened carefully to what he said.",
      "hasError": false
    }
  ]
}`

export function buildFocusErrorTrapUserPrompt(input: {
  gaps: Array<{ kind: string; label: string; level?: string }>;
  level: string;
}): string {
  const gapsList = input.gaps.map((g) => `${g.label} (${g.kind})`).join(', ')
  return `Generate 5 error-trap sentences (3 correct, 2 with typical mistakes) for level ${input.level.toUpperCase()} targeting: ${gapsList}.`
}

export const FOCUS_SONG_SYSTEM_PROMPT = `You are a creative songwriter and ESL educator.
Write a rhythmic, memorable 16-line song/poem lyric in English that incorporates the target gap pattern repeatedly and catchily.
Features:
- Exactly 16 lines (separated by newline).
- Rhyme scheme or strong rhythm (AABB, ABAB, or ballad meter).
- "gapLines": An array of 0-based integers indicating which lines (0 to 15) contain the target gap pattern.
- "notes": 1-2 sentences in Spanish highlighting the rhythmic/phonetic pattern to listen for or sing along with.

Return ONLY raw valid JSON with no markdown formatting:
{
  "title": "Song or poem title",
  "lyrics": "Line 1\\nLine 2\\n...",
  "gapLines": [0, 2, 4, 8, 12],
  "notes": "Fíjate en el ritmo de los verbos en pasado al final de cada estrofa..."
}`

export function buildFocusSongUserPrompt(input: {
  gaps: Array<{ kind: string; label: string; level?: string }>;
  level: string;
}): string {
  const gapsList = input.gaps.map((g) => `${g.label} (${g.kind})`).join(', ')
  return `Write a 16-line rhythmic song/rhyme for level ${input.level.toUpperCase()} focused on practicing: ${gapsList}.`
}

export function buildReaderAudioPrompt(passageText: string): string {
  return `Please read the following English story aloud with clear, natural pronunciation and articulate phrasing at a moderate pace suitable for language learning:\n\n${passageText.trim()}`
}

export function buildMissionAudioPrompt(lineText: string): string {
  return `Please speak the following conversational dialogue line aloud with natural pronunciation, expressive intonation, and native cadence suitable for language learning:\n\n${lineText.trim()}`
}

export const IMMERSION_ENRICH_SYSTEM_PROMPT = `You are an ESL curriculum designer building study material for Spanish-speaking learners around a real English video lesson from engVid.

You receive only the lesson's title, its official description, its published categories, and its duration. You do NOT receive a transcript. Never invent specific claims about what the teacher said, wrote on the board, or did at a given moment.

Produce:
- keyVocabulary: 4-6 words or short structures that this specific lesson is genuinely about, inferred from the title and description. For each: the word, its IPA transcription in slashes using standard General American symbols, a definition written in Spanish (max 140 characters), and one natural English example sentence (max 90 characters) showing real usage.
- targetPhrases: 3-4 natural English phrases a learner should be able to say after this lesson. Each with its IPA and a short note in Spanish (max 100 characters) about rhythm, linking, or when to use it.
- quiz: 3 comprehension questions in Spanish about the CONCEPT the lesson teaches, each with exactly 4 plausible options and one correct answer, plus a Spanish explanation (max 180 characters). Test understanding of the language point, never trivia about the video itself.
- summary: 1-2 sentences in Spanish (max 220 characters) describing what the learner will be able to do after this lesson. Write it as a benefit, not as a description of the video.

Rules:
- Vocabulary must be specific to this lesson. Never emit the lesson slug, a bare number, or a generic placeholder as a word.
- IPA must be plausible General American, wrapped in forward slashes.
- Spanish text uses correct accents and natural phrasing, never machine-translated English.
- Output JSON only, no markdown fences.`

export function buildImmersionEnrichUserPrompt(input: {
  title: string
  teacher: string
  description: string
  categories: string[]
  durationMinutes: number
}): string {
  const categories = input.categories.length > 0 ? input.categories.join(', ') : 'unspecified'
  return `Lesson title: ${input.title}
Teacher: ${input.teacher}
Published categories: ${categories}
Duration: ${input.durationMinutes} minutes
Official description: ${input.description}

Return JSON: { "summary": string, "keyVocabulary": [{ "word": string, "ipa": string, "definition": string, "contextSentence": string }], "targetPhrases": [{ "phrase": string, "ipa": string, "note": string }], "quiz": [{ "question": string, "options": [string,string,string,string], "correctIndex": number, "explanation": string }] }`
}
