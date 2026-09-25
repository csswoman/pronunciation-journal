import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  JOURNAL_CORRECTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
  buildJournalCorrectionPrompt,
} from '../../lib/ai-prompts'
import { callWithFallback, stripJsonFences } from '../../lib/gemini/client'
import { BASE_MODELS, QUALITY_FALLBACK_MODELS } from '../../lib/gemini/fallback'
import { productionGradeResponseSchema } from '../../lib/exercises/production-grade-schema'
import { journalCorrectionResultSchema } from '../../lib/journal/correction'
import type { GradeProductionInput } from '../../lib/exercises/production-grade'
import type { CEFRLevel } from '../../lib/exercises/cefr'

type GradeCase = {
  id: string
  kind: 'grade'
  input: GradeProductionInput
  checks: { correct?: boolean; usedTarget?: boolean; constraintMet?: boolean }
}
type JournalCase = {
  id: string
  kind: 'journal'
  input: { content: string; level: CEFRLevel }
  checks: { maxErrors: number; correctedIncludesAny?: string[] }
}
type EvalCase = GradeCase | JournalCase
type CaseResult = { id: string; ok: boolean; issues: string[]; output?: unknown }

const directory = fileURLToPath(new URL('./cases/', import.meta.url))
const baselinePath = fileURLToPath(new URL('./baseline.json', import.meta.url))
const modelArgument = process.argv.find((arg) => arg.startsWith('--model='))?.slice('--model='.length)
const model = modelArgument ?? QUALITY_FALLBACK_MODELS[0]
if (![...BASE_MODELS, ...QUALITY_FALLBACK_MODELS].includes(model)) {
  throw new Error(`Model ${model} is not in the verified free text-model inventory`)
}
const useStructuredOutput = !process.argv.includes('--legacy')
const caseId = process.argv.find((arg) => arg.startsWith('--case='))?.slice('--case='.length)

if (!process.env.GEMINI_API_KEY && existsSync('.env.local')) loadEnvFile('.env.local')
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('GEMINI_API_KEY is required for prompt evaluation')

const cases = readdirSync(directory)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => JSON.parse(readFileSync(fileURLToPath(new URL(name, new URL('./cases/', import.meta.url))), 'utf8')) as EvalCase)
if (cases.length !== 12 || new Set(cases.map((item) => item.id)).size !== 12) {
  throw new Error('Expected exactly 12 uniquely identified prompt evaluation cases')
}
const selectedCases = caseId ? cases.filter((item) => item.id === caseId) : cases
if (selectedCases.length === 0) throw new Error(`Unknown case: ${caseId}`)

function inspect(item: EvalCase, output: unknown): string[] {
  const issues: string[] = []
  if (item.kind === 'grade') {
    const grade = productionGradeResponseSchema.parse(output)
    for (const field of ['correct', 'usedTarget', 'constraintMet'] as const) {
      const expected = item.checks[field]
      if (expected !== undefined && grade[field] !== expected) {
        issues.push(`${field}: expected ${expected}, got ${grade[field]}`)
      }
    }
  } else {
    const correction = journalCorrectionResultSchema.parse(output)
    if (correction.errors.length > item.checks.maxErrors) {
      issues.push(`errors: expected at most ${item.checks.maxErrors}, got ${correction.errors.length}`)
    }
    const alternatives = item.checks.correctedIncludesAny
    if (alternatives && !alternatives.some((value) => correction.correctedContent.toLowerCase().includes(value))) {
      issues.push(`correctedContent: missing one of ${alternatives.join(', ')}`)
    }
  }
  return issues
}

async function evaluate(item: EvalCase): Promise<CaseResult> {
  const schema = item.kind === 'grade' ? productionGradeResponseSchema : journalCorrectionResultSchema
  const contents = item.kind === 'grade'
    ? buildGradeProductionUserPrompt(item.input)
    : buildJournalCorrectionPrompt(item.input.content, [], item.input.level)
  const systemInstruction = item.kind === 'grade'
    ? GRADE_PRODUCTION_SYSTEM_PROMPT
    : JOURNAL_CORRECTION_SYSTEM_PROMPT

  try {
    const output = await callWithFallback(apiKey!, {
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        ...(useStructuredOutput ? { responseJsonSchema: z.toJSONSchema(schema) } : {}),
        temperature: 0.1,
        maxOutputTokens: item.kind === 'grade' ? 768 : 1400,
      },
    }, (raw) => schema.parse(JSON.parse(stripJsonFences(raw))), {
      feature: `prompt-eval:${item.kind}`,
      models: [model],
      maxAttempts: 1,
    })
    const issues = inspect(item, output)
    return { id: item.id, ok: issues.length === 0, issues, output }
  } catch (error) {
    const kind = error instanceof SyntaxError || error instanceof z.ZodError ? 'parse' : 'provider'
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? String(error.status)
      : 'unknown'
    const detail = error instanceof Error ? `; ${error.name}: ${error.message.slice(0, 120).replaceAll(apiKey!, '[redacted]')}` : ''
    return { id: item.id, ok: false, issues: [`${kind} error (status ${status}${detail})`] }
  }
}

async function main(): Promise<void> {
  const results: CaseResult[] = []
  for (const [index, item] of selectedCases.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 4_500))
    const result = await evaluate(item)
    results.push(result)
    console.log(`${result.ok ? 'OK' : 'FAIL'} ${item.id}${result.issues.length ? `: ${result.issues.join('; ')}` : ''}`)
    if (result.issues.some((issue) => issue.startsWith('provider error'))) break
  }

  const passed = results.filter((result) => result.ok).length
  const parseErrors = results.filter((result) => result.issues.some((issue) => issue.startsWith('parse error'))).length
  const providerErrors = results.filter((result) => result.issues.some((issue) => issue.startsWith('provider error'))).length
  console.log(`${passed}/12 casos OK; ${parseErrors} errores de parseo; ${providerErrors} errores de proveedor`)

  if (providerErrors > 0) {
    console.error('No se guarda una línea base incompleta por errores de proveedor.')
    process.exitCode = 1
  } else if (caseId) {
    if (parseErrors > 0) process.exitCode = 1
  } else if (!existsSync(baselinePath)) {
    writeFileSync(baselinePath, `${JSON.stringify({ model, passed, parseErrors, results }, null, 2)}\n`)
    console.log('Línea base guardada en scripts/prompt-eval/baseline.json')
  } else {
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as { passed: number }
    if (passed < baseline.passed || parseErrors > 0) process.exitCode = 1
    console.log(`Comparación con línea base: ${passed}/${baseline.passed} casos OK`)
  }
}

void main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
