/**
 * Script CLI: Pre-generación local de audio Edge TTS para el banco de listening (Plan 033).
 *
 * Recorre `LISTENING_BANK` (lib/courses/listening-bank.ts) y deja un WAV estable por
 * clip en `public/listening/{clipId}.wav`. Cada clip es un diálogo breve de dos
 * hablantes: sintetiza cada línea con la voz de su hablante (A/B) y usa FFmpeg
 * para unirlas como WAV con una breve pausa entre líneas.
 *
 * El audio se pre-genera OFFLINE. La transcripción vive solo en el banco (servidor):
 * este script escribe únicamente el WAV; nunca emite la transcripción a `public/`.
 *
 * Es idempotente: salta archivos existentes. `--variant` crea un WAV alternativo
 * con otro nombre y nunca reemplaza el audio actual.
 *
 * Uso:
 *   pnpm generate:listening-audio
 *   pnpm generate:listening-audio --level a1
 *   pnpm generate:listening-audio --level a1 --variant aria-natural
 *   pnpm generate:listening-audio --level a1 --variant aria-natural --dry-run
 *
 * Requisitos locales: `pip install edge-tts` y FFmpeg disponible en PATH.
 *
 * Flags:
 *   --level <id>       Procesa solo ese nivel CEFR (repetible): a1..c2.
 *   --variant <name>   Guarda una toma alternativa con sufijo propio, sin reemplazar.
 *   --dry-run          No genera ni escribe; solo informa qué haría.
 *   --voice-a <name>   Voz Edge TTS del hablante A (default: en-US-GuyNeural).
 *   --voice-b <name>   Voz Edge TTS del hablante B (default: en-US-AriaNeural).
 *   --rpm <n>          Ritmo máximo de solicitudes por minuto (default: 3).
 *   --max-retries <n>  Reintentos ante 429 antes de rendirse (default: 5).
 *
 * Nota: los límites gratuitos varían por proyecto y modelo; el ritmo es configurable.
 * El banco tiene 18 clips de ~4 líneas, unas 72 llamadas a 3 req/min. Idempotente:
 * si se corta, relánzalo y retoma donde quedó.
 */

import { mkdir, mkdtemp, access, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import {
  LISTENING_LEVEL_ORDER,
  allListeningItems,
  listeningAudioSrc,
  type ListeningItem,
  type ListeningLine,
} from "@/lib/courses/listening-bank";
import type { CefrLevelId } from "@/lib/courses/types";

type EdgeVoice = string;
const execFileAsync = promisify(execFile);

const OUTPUT_DIR = path.join(process.cwd(), "public", "listening");
/** Silence between dialogue lines, in seconds, so speakers don't run together. */
const GAP_SECONDS = 0.5;

interface CliOptions {
  levels: CefrLevelId[];
  variant: string | null;
  dryRun: boolean;
  voiceA: EdgeVoice;
  voiceB: EdgeVoice;
  rpm: number;
  maxRetries: number;
}

const CEFR_IDS = new Set<string>(LISTENING_LEVEL_ORDER);

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    levels: [],
    variant: null,
    dryRun: false,
    voiceA: "en-US-GuyNeural",
    voiceB: "en-US-AriaNeural",
    rpm: 3,
    maxRetries: 5,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--level") {
      const level = argv[i + 1];
      if (!level || level.startsWith("--")) throw new Error("Falta el valor de --level.");
      if (!CEFR_IDS.has(level)) {
        throw new Error(`Nivel inválido "${level}". Valores permitidos: ${LISTENING_LEVEL_ORDER.join(", ")}.`);
      }
      opts.levels.push(level as CefrLevelId);
      i += 1;
    } else if (arg === "--variant") {
      const variant = argv[i + 1];
      if (!variant || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variant)) {
        throw new Error("--variant requiere un nombre en minúsculas con letras, números y guiones.");
      }
      opts.variant = variant;
      i += 1;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--voice-a" || arg === "--voice-b") {
      const voice = argv[i + 1];
      if (!voice || voice.startsWith("--")) throw new Error(`Falta el valor de ${arg}.`);
      if (arg === "--voice-a") opts.voiceA = voice;
      else opts.voiceB = voice;
      i += 1;
    } else if (arg === "--rpm") {
      const value = argv[i + 1];
      if (!value || !/^\d+$/.test(value)) throw new Error("--rpm debe ser un entero positivo.");
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error("--rpm debe ser un entero positivo.");
      }
      opts.rpm = parsed;
      i += 1;
    } else if (arg === "--max-retries") {
      const value = argv[i + 1];
      if (!value || !/^\d+$/.test(value)) throw new Error("--max-retries debe ser un entero no negativo.");
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed)) throw new Error("--max-retries debe ser un entero no negativo.");
      opts.maxRetries = parsed;
      i += 1;
    } else {
      throw new Error(`Argumento desconocido: ${arg}`);
    }
  }

  return opts;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function createRequestPacer(rpm: number): () => Promise<void> {
  const intervalMs = Math.ceil(60_000 / rpm);
  let nextAllowedAt = 0;

  return async () => {
    const waitMs = nextAllowedAt - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    nextAllowedAt = Date.now() + intervalMs;
  };
}

function errorDetails(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const output = typeof err === "object" && err !== null && "stderr" in err ? err.stderr : undefined;
  return `${err.message} ${typeof output === "string" ? output : ""}`;
}

/** Detecta respuestas de limitación del servicio de voz. */
function isRateLimitError(err: unknown): boolean {
  return /\b429\b|too many requests|rate.?limit|throttl/i.test(errorDetails(err));
}

/** Lee el retryDelay indicado por el servicio; fallback 20s. */
function retryDelayMs(err: unknown, fallbackMs: number): number {
  const message = errorDetails(err);
  const match = message.match(/"retryDelay":"(\d+)s"/) ?? message.match(/retry in ([\d.]+)s/);
  if (match?.[1]) {
    const seconds = Number.parseFloat(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000) + 1_000;
  }
  return fallbackMs;
}

async function runCommand(command: string, args: string[]): Promise<void> {
  try {
    await execFileAsync(command, args, { windowsHide: true, maxBuffer: 1_000_000 });
  } catch (err) {
    const code = typeof err === "object" && err !== null && "code" in err ? err.code : undefined;
    if (code === "ENOENT") {
      if (command === (process.env.PYTHON_BIN ?? "python")) {
        throw new Error("No se encontró Python. Instala Python o define PYTHON_BIN con la ruta a python.exe.");
      }
      throw new Error("No se encontró FFmpeg. Instálalo y agrega ffmpeg al PATH, o define FFMPEG_PATH.");
    }
    throw err;
  }
}

/** Genera el MP3 de una línea y reintenta ante límites temporales. */
async function generateLineWithRetry(
  text: string,
  voice: EdgeVoice,
  outputPath: string,
  maxRetries: number,
  paceRequest: () => Promise<void>,
): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      await paceRequest();
      await runCommand(process.env.PYTHON_BIN ?? "python", [
        "-m", "edge_tts",
        "--voice", voice,
        "--text", text,
        "--write-media", outputPath,
      ]);
      return;
    } catch (err) {
      if (/No module named edge_tts/i.test(errorDetails(err))) {
        throw new Error("edge-tts no está instalado para este Python. Instálalo con: python -m pip install edge-tts");
      }
      if (!isRateLimitError(err) || attempt >= maxRetries) throw err;
      attempt += 1;
      const waitMs = retryDelayMs(err, 20_000);
      console.log(`    · servicio ocupado, esperando ${Math.round(waitMs / 1000)}s (reintento ${attempt}/${maxRetries})`);
      await sleep(waitMs);
    }
  }
}

/** Une MP3 por línea y silencio generado con FFmpeg en un único WAV mono. */
async function combineLinesToWav(linePaths: string[], outputPath: string): Promise<void> {
  if (linePaths.length === 0) throw new Error("El clip no contiene líneas de audio.");

  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  const filters: string[] = [];
  const segments: string[] = [];
  let inputIndex = 0;

  for (let i = 0; i < linePaths.length; i += 1) {
    args.push("-i", linePaths[i] as string);
    filters.push(
      `[${inputIndex}:a]aresample=24000,aformat=sample_fmts=s16:sample_rates=24000:channel_layouts=mono[line${i}]`,
    );
    segments.push(`[line${i}]`);
    inputIndex += 1;

    if (i < linePaths.length - 1) {
      args.push("-f", "lavfi", "-t", String(GAP_SECONDS), "-i", "anullsrc=r=24000:cl=mono");
      filters.push(
        `[${inputIndex}:a]aformat=sample_fmts=s16:sample_rates=24000:channel_layouts=mono[gap${i}]`,
      );
      segments.push(`[gap${i}]`);
      inputIndex += 1;
    }
  }

  const filter = `${filters.join(";")};${segments.join("")}concat=n=${segments.length}:v=0:a=1[out]`;
  args.push("-filter_complex", filter, "-map", "[out]", "-c:a", "pcm_s16le", "-ar", "24000", "-ac", "1", outputPath);
  await runCommand(process.env.FFMPEG_PATH ?? "ffmpeg", args);
}

function voiceForLine(line: ListeningLine, opts: CliOptions): EdgeVoice {
  return line.speaker === "A" ? opts.voiceA : opts.voiceB;
}

function outputPathFor(clipId: string, variant: string | null): string {
  const baseName = path.basename(listeningAudioSrc(clipId), ".wav");
  const fileName = `${baseName}${variant ? `-${variant}` : ""}.wav`;
  return path.join(OUTPUT_DIR, fileName);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

interface RunSummary {
  generated: number;
  skipped: number;
  errors: number;
}

async function processClip(
  item: ListeningItem,
  opts: CliOptions,
  summary: RunSummary,
  paceRequest: () => Promise<void>,
): Promise<"generated" | "skipped" | "error"> {
  const outPath = outputPathFor(item.id, opts.variant);
  const label = `${item.level.toUpperCase()} · ${item.id}${opts.variant ? ` · ${opts.variant}` : ""}`;

  if (await fileExists(outPath)) {
    console.log(`  ↷ existe   ${label}`);
    summary.skipped += 1;
    return "skipped";
  }

  if (opts.dryRun) {
    console.log(`  ○ dry-run  ${label} — ${item.lines.length} líneas → ${path.relative(process.cwd(), outPath)}`);
    for (const line of item.lines) {
      console.log(`      ${line.speaker}/${voiceForLine(line, opts)}: "${line.text}"`);
    }
    summary.generated += 1;
    return "generated";
  }

  try {
    const workingDir = await mkdtemp(path.join(process.cwd(), ".listening-audio-"));
    try {
      const linePaths: string[] = [];
      for (let i = 0; i < item.lines.length; i += 1) {
        const line = item.lines[i] as ListeningLine;
        const linePath = path.join(workingDir, `line-${i + 1}.mp3`);
        await generateLineWithRetry(line.text, voiceForLine(line, opts), linePath, opts.maxRetries, paceRequest);
        linePaths.push(linePath);
      }

      const stagedOutput = path.join(workingDir, `${randomUUID()}.wav`);
      await combineLinesToWav(linePaths, stagedOutput);
      await rename(stagedOutput, outPath);
    } finally {
      await rm(workingDir, { recursive: true, force: true });
    }
    console.log(`  ✓ generado ${label} → ${path.relative(process.cwd(), outPath)}`);
    summary.generated += 1;
    return "generated";
  } catch (err) {
    const message = errorDetails(err);
    console.error(`  ✗ error    ${label} — ${message}`);
    summary.errors += 1;
    return "error";
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.dryRun) await mkdir(OUTPUT_DIR, { recursive: true });

  const levels = opts.levels.length ? opts.levels : LISTENING_LEVEL_ORDER;
  const selectedLevels = new Set(levels);
  const items = allListeningItems().filter((item) => selectedLevels.has(item.level));

  console.log(
    `Pre-generando audio de listening${opts.dryRun ? " (DRY RUN)" : ""}: ` +
      `${items.length} clips` +
      `${opts.variant ? `, variante ${opts.variant}` : ""}` +
      `${opts.dryRun ? "" : `, ${opts.rpm} req/min, voces A=${opts.voiceA}/B=${opts.voiceB}`}\n`,
  );

  const summary: RunSummary = { generated: 0, skipped: 0, errors: 0 };
  const paceRequest = createRequestPacer(opts.rpm);
  for (const item of items) {
    await processClip(item, opts, summary, paceRequest);
  }

  console.log(
    `\nHecho. Generados: ${summary.generated}  Saltados: ${summary.skipped}  Errores: ${summary.errors}`,
  );
  process.exit(summary.errors > 0 ? 1 : 0);
}

void main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
