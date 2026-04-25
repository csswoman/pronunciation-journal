import { BASE_TUTOR_PROMPT } from "@/lib/ai-practice/prompts";

// ---------------------------------------------------------------------------
// Server-side prompt registry
//
// Clients send a `promptKey` enum value. The server resolves it here.
// No raw prompt text is ever accepted from the client.
// ---------------------------------------------------------------------------

export type PromptKey = "default" | "admin-seed";

// Context injected by the server when building the admin-seed prompt.
// These fields come from validated client input (Zod-checked) and/or
// re-fetched from the database, never trusted as-is from the client.
export interface AdminSeedContext {
  activeTab: string;
  sounds: Array<{ id: string; ipa: string; type: string; category: string | null; example: string | null }>;
}

function buildAdminSeedPrompt(ctx: AdminSeedContext): string {
  const soundsContext =
    ctx.sounds.length > 0
      ? `\nAvailable sounds in the database (use these exact IDs for soundId / soundAId / soundBId / contrastAId / contrastBId fields):\n${ctx.sounds
          .map((s) => `  id=${s.id}  /${s.ipa}/  ${s.type}  ${s.category ?? ""}  example: ${s.example ?? "—"}`)
          .join("\n")}\n`
      : "\nNo sounds in the database yet.\n";

  return `You are an assistant for a language learning app called English Journal.
The admin is currently on the "${ctx.activeTab}" tab of the seed data page.
Your job is to suggest data to insert into the database tables: sounds, words, patterns, pattern_words, and minimal_pairs.
${soundsContext}
When the admin asks for suggestions, respond with a clear explanation AND one or more JSON blocks they can apply.
Each JSON block must be wrapped in a \`\`\`apply\`\`\` code fence with this structure:
\`\`\`apply
{ "tab": "${ctx.activeTab}", "data": { ...fields } }
\`\`\`

Field reference:
- sounds: ipa (string), type ("vowel"|"consonant"|"diphthong"), category (string), example (string), difficulty ("1"|"2"|"3")
- words: word (string), ipa (string), soundId (string id from the list above), soundFocus (string ipa), difficulty ("1"|"2"|"3")
- patterns: pattern (string), type ("vowel"|"consonant"|"digraph"|"silent"|"blend"|"diphthong"), focus (string ipa)
- pattern_words: patternId (string id), word (string), ipa (string)
- minimal_pairs: wordA, wordB, ipaA, ipaB, soundGroup, soundAId, soundBId, contrastAId, contrastBId, contrastIpaA, contrastIpaB (all strings)

For minimal_pairs: contrastAId = the ID of the sound present in wordA, contrastBId = the ID of the sound present in wordB.
Keep responses concise. You can suggest multiple items, each in its own \`\`\`apply\`\`\` block.`;
}

export function buildServerPrompt(key: PromptKey, context?: AdminSeedContext): string {
  switch (key) {
    case "admin-seed":
      if (!context) throw new Error("admin-seed prompt requires context");
      return buildAdminSeedPrompt(context);
    case "default":
    default:
      return BASE_TUTOR_PROMPT;
  }
}
