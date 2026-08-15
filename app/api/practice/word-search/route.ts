import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'

const WordSearchRequestSchema = z.object({
  topic: z.string().min(1).max(150),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  count: z.number().int().min(4).max(8).optional().default(6),
  knownWords: z.array(z.string().max(50)).max(30).optional(),
})

const WordSearchItemSchema = z.object({
  word: z.string().min(2).max(12),
  ipa: z.string().min(1).max(30).optional(),
  clue: z.string().min(5).max(300),
  meaningEs: z.string().min(1).max(150),
  exampleSentence: z.string().min(5).max(250),
})

const WordSearchResponseSchema = z.object({
  topicTitle: z.string(),
  words: z.array(WordSearchItemSchema).min(3).max(10),
})

const WORD_SEARCH_SYSTEM_PROMPT = `You are a linguistics and English learning coach.
Generate a cohesive set of vocabulary words for a Word Search & Clue Finder puzzle.

Rules:
1. Words must be single English words (NO SPACES, NO HYPHENS, length 3 to 10 characters).
2. All words must strictly fit the user's requested topic or phonetic focus.
3. Provide an accurate IPA transcription for each word (enclosed in slashes, e.g. "/ˈtiː.tʃər/").
4. Provide a clear, natural English clue/definition that allows the learner to guess or understand the word.
5. Provide the Spanish translation (meaningEs) and a natural example sentence in English.
6. Output MUST strictly conform to the requested JSON schema.`

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await rateLimit(
    `/api/practice/word-search:${user.id}`,
    {
      max: 12,
      windowMs: 60_000,
      meta: { endpoint: '/api/practice/word-search', userId: user.id },
    }
  )
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(
    request,
    WordSearchRequestSchema
  )
  if (validationError) return validationError as NextResponse

  const userPrompt = `Generate a word search puzzle with ${body.count} words.
Topic: "${body.topic}"
Learner level: ${body.level}
${body.knownWords && body.knownWords.length > 0 ? `Incorporate or complement these known words if relevant: ${body.knownWords.join(', ')}` : ''}

Respond with JSON:
{
  "topicTitle": "Short title describing the set",
  "words": [
    {
      "word": "EXAMPLENOSPACES",
      "ipa": "/.../",
      "clue": "Clear definition or hint in English",
      "meaningEs": "Significado en español",
      "exampleSentence": "A short natural example sentence using the word."
    }
  ]
}`

  const { data: parsed, response } = await callGeminiJson({
    endpoint: '/api/practice/word-search',
    userId: user.id,
    params: {
      contents: userPrompt,
      config: {
        systemInstruction: WORD_SEARCH_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    },
    parse: (text) => parseGeminiJson(text, (json) => WordSearchResponseSchema.parse(json)),
    failureMessage: 'No se pudo generar la búsqueda de palabras con IA',
  })

  if (response) return response

  return NextResponse.json(parsed)
}
