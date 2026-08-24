import { z } from "zod";
import { type PromptKey } from "@/lib/api/prompts";

// ---------------------------------------------------------------------------
// Request schema — all strings bounded, unknown keys rejected
// ---------------------------------------------------------------------------

export const MessagePartSchema = z.object({
  text: z.string().max(8_000).optional(),
  functionCall: z.object({
    name: z.string().max(100),
    args: z.record(z.string(), z.unknown()),
  }).strict().optional(),
  functionResponse: z.object({
    name: z.string().max(100),
    response: z.record(z.string(), z.unknown()),
  }).strict().optional(),
}).strict();

export const VoiceMetadataSchema = z.object({
  transcript: z.literal(true),
  scored: z.boolean(),
}).strict();

export const MessageSchema = z.object({
  role: z.enum(["user", "model", "tool"]),
  content: z.string().max(8_000).optional(),
  parts: z.array(MessagePartSchema).max(20).optional(),
  toolCallId: z.string().max(200).optional(),
  name: z.string().max(100).optional(),
  result: z.unknown().optional(),
  voice: VoiceMetadataSchema.optional(),
}).strict();

export const GeminiRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  /**
   * Named key resolved to a server-defined system prompt.
   * Closed enum — any value outside this list is rejected with 400.
   * The client cannot supply raw prompt text.
   */
  promptKey: z.enum(["default"] satisfies [PromptKey, ...PromptKey[]]).optional().default("default"),
  missionId: z.string().min(1).max(120).optional(),
  stream: z.boolean().optional().default(false),
}).strict();

export type GeminiRequestBody = z.infer<typeof GeminiRequestSchema>;
