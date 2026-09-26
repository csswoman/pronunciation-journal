import { z } from "zod";
import type { CEFRLevel } from "@/lib/exercises/cefr";
import {
  CONTENT_BANK_EXERCISE_SET_PROMPT,
  buildContentBankSetPrompt,
} from "@/lib/ai-prompts";
import { callGeminiJson, parseGeminiJson } from "@/lib/gemini/json-route";
import { parseToolArgs, isValidToolName, isExerciseTool } from "@/lib/ai-practice/tools/registry";
import { createHash } from "crypto";
import { extractStemFromPayload } from "./stem";
import type { GeneratedExerciseCandidate, ContentBankToolName } from "./types";
import { DEFAULT_BANK_MODEL } from "./constants";

function computeStemHash(stem: string): string {
  return createHash("sha256").update(stem).digest("hex");
}

const ExercisePayloadSchema = z.object({
  topic: z.string().optional(),
  instruction: z.string().optional(),
  learningGoal: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().optional(),
  explanation: z.string().optional(),
  sentence: z.string().optional(),
  answer: z.string().optional(),
  acceptableAnswers: z.array(z.string()).optional(),
  acceptableAlternatives: z.array(
    z.object({
      value: z.string(),
      reason: z.string(),
    }),
  ).optional(),
  prompt: z.string().optional(),
  target: z.string().optional(),
  ipa: z.string().optional(),
  commonWrongAnswers: z.array(
    z.object({
      value: z.string(),
      feedback: z.string(),
    }),
  ).optional(),
  hint: z.union([
    z.string(),
    z.object({
      level1: z.string(),
      level2: z.string(),
      level3: z.string().optional(),
    }),
  ]).optional(),
});

export const ContentBankSetResponseSchema = z.object({
  exercises: z.array(
    z.object({
      tool_name: z.enum([
        "render_multiple_choice",
        "render_fill_blank",
        "render_speaking",
      ]),
      payload: ExercisePayloadSchema,
    }),
  ),
});

export type ContentBankSetResponse = z.infer<typeof ContentBankSetResponseSchema>;

export async function generateBankSet(
  level: CEFRLevel,
  topicId: string,
  avoidStems?: string[],
): Promise<GeneratedExerciseCandidate[]> {
  const result = await callGeminiJson<ContentBankSetResponse>({
    endpoint: "/api/jobs/fill-content-bank",
    params: {
      contents: buildContentBankSetPrompt({ level, topicId, avoidStems }),
      config: {
        systemInstruction: CONTENT_BANK_EXERCISE_SET_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    },
    schema: ContentBankSetResponseSchema,
    parse: (raw) => parseGeminiJson(raw, (json) => ContentBankSetResponseSchema.parse(json)),
    failureMessage: "Failed to generate content bank set",
    fallbackOptions: {
      feature: "content-bank",
      models: [DEFAULT_BANK_MODEL],
      maxAttempts: 1,
      skipBudgetReservation: true,
    },
  });

  if (!result.data || !Array.isArray(result.data.exercises)) {
    return [];
  }

  const validCandidates: GeneratedExerciseCandidate[] = [];

  for (const item of result.data.exercises) {
    if (!isValidToolName(item.tool_name) || !isExerciseTool(item.tool_name)) {
      continue;
    }

    const payload = {
      topic: topicId,
      ...item.payload,
    };

    try {
      const parsedArgs = parseToolArgs(item.tool_name, payload);
      const stem = extractStemFromPayload(payload);
      if (!stem) continue;

      const stem_hash = computeStemHash(stem);
      validCandidates.push({
        tool_name: item.tool_name as ContentBankToolName,
        payload: parsedArgs as Record<string, unknown>,
        stem_hash,
      });
    } catch {
      // Discard invalid items as required by Plan 041
      continue;
    }
  }

  return validCandidates;
}
