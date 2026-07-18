import { BASE_TUTOR_PROMPT } from "@/lib/ai-practice/prompts";

// ---------------------------------------------------------------------------
// Server-side prompt registry
//
// Clients send a `promptKey` enum value. The server resolves it here.
// No raw prompt text is ever accepted from the client.
// ---------------------------------------------------------------------------

export type PromptKey = "default";

export function buildServerPrompt(): string {
  return BASE_TUTOR_PROMPT;
}
