import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// We'll define simple schemas locally in the script to avoid dependency path issues at execution time
const LessonLevelSchema = z.enum(["basic", "intermediate", "advanced"]);
const LessonCategorySchema = z.enum([
  "pronunciation",
  "grammar",
  "vocabulary",
  "listening",
  "speaking",
  "writing",
  "idioms",
  "collocations",
]);

const MiniLessonExampleSchema = z.object({
  word: z.string(),
  ipa: z.string().optional(),
  translation: z.string().optional(),
});

const MiniLessonSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  level: LessonLevelSchema,
  category: LessonCategorySchema,
  duration: z.number(),
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  examples: z.array(MiniLessonExampleSchema),
  tip: z.string().optional(),
  href: z.string(),
});

const LessonSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
});

const LessonExampleSchema = z.object({
  english: z.string(),
  ipa: z.string().optional(),
  translation: z.string().optional(),
  note: z.string().optional(),
});

const LessonExerciseSchema = z.object({
  instruction: z.string(),
  items: z.array(z.string()),
  answers: z.array(z.string()),
});

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correct: z.number().int(),
  explanation: z.string(),
});

const LessonContentSchema = z.object({
  slug: z.string().min(1),
  sections: z.array(LessonSectionSchema),
  examples: z.array(LessonExampleSchema),
  exercises: z.array(LessonExerciseSchema),
  quiz: z.array(QuizQuestionSchema),
});

const LESSONS_DIR = path.join(process.cwd(), "public", "lessons");
const MINI_LESSONS_DIR = path.join(process.cwd(), "public", "mini-lessons");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const force = args.includes("--force");
const slugArg = args.indexOf("--slug");
const targetSlug = slugArg >= 0 ? args[slugArg + 1] : null;
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : all ? Infinity : 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hasSpanishAnswers(lesson: { exercises?: Array<{ answers?: string[] }> }): boolean {
  if (!lesson.exercises || lesson.exercises.length === 0) return false;
  return lesson.exercises.some((ex) => {
    const answers = ex.answers || [];
    return answers.some((ans: string) => {
      const lower = ans.toLowerCase();
      // Heuristic for Spanish content in answer keys
      return (
        /[áéíóúñ]/.test(lower) ||
        /\b(el|la|los|las|un|una|y|o|en|con|para|por|es|son|fue|fueron|de|del|si|sí|haría|harías|harían|estoy|está|están|bebidas|parece|escribir|escribió|estudiando|viajaría|se|segun|como)\b/.test(lower)
      );
    });
  });
}

type GeminiClient = {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      config: { responseMimeType: string };
    }) => Promise<unknown>;
  };
};

async function callGeminiWithRetry(ai: GeminiClient, prompt: string, retries = 5): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      return res;
    } catch (err: unknown) {
      const errorObj = err as { status?: number; statusCode?: number; message?: string };
      const isRateLimit =
        errorObj.status === 429 ||
        errorObj.statusCode === 429 ||
        String(errorObj.message).toLowerCase().includes("quota") ||
        String(errorObj.message).toLowerCase().includes("rate limit") ||
        String(errorObj.message).toLowerCase().includes("exhausted");

      if (isRateLimit && i < retries - 1) {
        const delay = 60000 + i * 30000;
        console.warn(`[RATE LIMIT] Quota exceeded. Retrying after ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

async function processLesson(ai: GeminiClient, slug: string) {
  const lessonPath = path.join(LESSONS_DIR, `${slug}.json`);
  const miniPath = path.join(MINI_LESSONS_DIR, `${slug}.json`);

  if (!fs.existsSync(lessonPath) || !fs.existsSync(miniPath)) {
    console.error(`Error: Slug files for "${slug}" not found.`);
    return;
  }

  const lessonData = JSON.parse(fs.readFileSync(lessonPath, "utf-8"));
  const miniData = JSON.parse(fs.readFileSync(miniPath, "utf-8"));

  // Check if we should skip based on resumability heuristic
  if (!force && !hasSpanishAnswers(lessonData)) {
    console.log(`Skipping "${slug}" (already verified/answers in English).`);
    return;
  }

  console.log(`Processing slug: "${slug}"...`);

  const prompt = `
You are an expert English teacher specializing in teaching Spanish speakers.
We are auditing and enriching our static lessons database.
There are two JSON files associated with the lesson "${slug}":
1. The main lesson content (contains sections, examples, exercises, and a quiz).
2. The mini-lesson card (contains metadata, title, body, and basic examples).

We have discovered translation errors in the exercise answers. In many lessons, the answers to English exercises were translated into Spanish instead of being the expected English input.

Your task:
1. Examine the \`exercises\` block.
   - Any answer in \`answers\` MUST be the expected English fill-in-the-blank or English rewrite answer. IT MUST NOT BE IN SPANISH.
   - For example:
     - Item: "She ___ (drink) coffee every morning." -> Correct answer: "drinks" (not "bebidas").
     - Item: "If I ___ (be) you, I ___ (tell) him the truth." -> Correct answer: "were / would tell" (not "fueron / dirían").
     - Item: "She made the decision to leave the company." -> Correct rewrite answer: "She decided to leave the company." (not "Decidió dejar la empresa.").
   - If there are multiple blanks (___) in a single item, the correct answer for that item must be a single string with values separated by " / " (with spaces before and after the slash).
   - Ensure the number of answers matches the number of items exactly.
2. Enrich the contents of both files:
   - Ensure the explanations in \`sections\` are clear, grammatically/phonetically accurate, and written in engaging, natural Spanish.
   - Check that \`examples\` in the main lesson have accurate English, correct phonetic IPA (if relevant to the category), and good Spanish translations/notes.
   - Ensure there is a helpful \`tip\` in Spanish.
   - Ensure the \`quiz\` is high-quality with at least 2 multiple-choice questions in Spanish, and the \`explanation\` is in Spanish.
   - Make sure the mini-lesson metadata (title, body, examples) matches the style and content of the main lesson.

Here are the current files content:

=== MAIN LESSON CONTENT ===
${JSON.stringify(lessonData, null, 2)}

=== MINI-LESSON METADATA ===
${JSON.stringify(miniData, null, 2)}

Return a single JSON object containing two root keys:
- \`lesson\`: The updated and corrected main lesson content (matching the LessonContentSchema).
- \`mini\`: The updated and corrected mini-lesson metadata (matching the MiniLessonSchema).

The JSON output structure should be:
{
  "lesson": {
    "slug": "${slug}",
    "sections": [{ "heading": "...", "body": "..." }],
    "examples": [{ "english": "...", "ipa": "...", "translation": "...", "note": "..." }],
    "exercises": [{ "instruction": "...", "items": [...], "answers": [...] }],
    "quiz": [{ "question": "...", "options": [...], "correct": 0, "explanation": "..." }]
  },
  "mini": {
    "id": ${miniData.id},
    "slug": "${slug}",
    "level": "${miniData.level}",
    "category": "${miniData.category}",
    "duration": ${miniData.duration},
    "title": "...",
    "subtitle": "...",
    "body": "...",
    "examples": [{ "word": "...", "translation": "..." }],
    "tip": "...",
    "href": "/mini-lessons/${slug}"
  }
}

Return ONLY the raw JSON object inside a \`\`\`json ... \`\`\` markdown code block. Do not include any other conversational text.
`;

  const res = await callGeminiWithRetry(ai, prompt);

  if (!res.text) {
    throw new Error(`Empty response from Gemini API for slug "${slug}"`);
  }

  // Parse output
  const parsedResponse = JSON.parse(res.text);

  // Validate schemas
  const validatedLesson = LessonContentSchema.parse(parsedResponse.lesson);
  const validatedMini = MiniLessonSchema.parse(parsedResponse.mini);

  if (!dryRun) {
    fs.writeFileSync(lessonPath, JSON.stringify(validatedLesson, null, 2) + "\n");
    fs.writeFileSync(miniPath, JSON.stringify(validatedMini, null, 2) + "\n");
    console.log(`Successfully updated and validated "${slug}".`);
  } else {
    console.log(`[DRY-RUN] Validated output for "${slug}" matches schemas. Output not written.`);
  }

  // Add delay between requests to avoid exceeding rate limits (15 RPM)
  await sleep(8000);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  let slugsToProcess: string[] = [];

  if (targetSlug) {
    slugsToProcess = [targetSlug];
  } else {
    slugsToProcess = fs
      .readdirSync(MINI_LESSONS_DIR)
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .map((f) => path.basename(f, ".json"));
  }

  if (limit !== Infinity) {
    slugsToProcess = slugsToProcess.slice(0, limit);
  }

  console.log(`Starting run on ${slugsToProcess.length} lessons...`);

  let successCount = 0;
  let failCount = 0;

  for (const slug of slugsToProcess) {
    try {
      await processLesson(ai, slug);
      successCount++;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`Failed to process slug "${slug}":`, err.message || error);
      failCount++;
    }
  }

  console.log(`\nRun complete: ${successCount} successful, ${failCount} failed.`);
}

main();
