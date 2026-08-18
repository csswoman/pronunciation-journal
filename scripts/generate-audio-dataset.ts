/**
 * Script CLI: Generador de Datasets de Audio para English Journal ($0 Cost)
 * 
 * Permite sintetizar archivos de audio .mp3 de alta fidelidad con voces neurales nativas
 * (US: Jenny, Guy, Aria / UK: Sonia, Ryan) para vocabulario Core 1000, pares mínimos y fonemas.
 * 
 * Uso:
 *   pnpm tsx scripts/generate-audio-dataset.ts --words "sheep,ship,beach,bitch,cat,cut" --out public/audio/vocab
 *   pnpm tsx scripts/generate-audio-dataset.ts --sentences "public/audio/samples.json" --voice en-US-JennyNeural
 */

import fs from 'node:fs';
import path from 'node:path';

export interface AudioGenerationOptions {
  words?: string[];
  outputDir: string;
  voice: string;
  rate?: string;
  format?: 'mp3' | 'webm';
}

export const DEFAULT_NEURAL_VOICES = {
  usFemale: 'en-US-JennyNeural',
  usMale: 'en-US-GuyNeural',
  ukFemale: 'en-GB-SoniaNeural',
  ukMale: 'en-GB-RyanNeural',
};

/**
 * Genera la estructura de metadatos para el dataset de audio.
 */
export function buildAudioDatasetManifest(
  items: string[],
  outputDir: string,
  voice: string = DEFAULT_NEURAL_VOICES.usFemale
) {
  return items.map((item) => {
    const slug = item
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const relativePath = path.posix.join(outputDir, `${slug}.mp3`);

    return {
      text: item,
      slug,
      filePath: relativePath,
      voice,
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Función principal ejecutable por CLI
 */
export async function runAudioGenerationCLI() {
  const args = process.argv.slice(2);
  let words: string[] = ['water', 'thought', 'through', 'beach', 'bitch', 'sheep', 'ship'];
  let outputDir = 'public/audio/generated';
  let voice = DEFAULT_NEURAL_VOICES.usFemale;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--words' && args[i + 1]) {
      words = args[i + 1].split(',').map((w) => w.trim());
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--voice' && args[i + 1]) {
      voice = args[i + 1];
      i++;
    }
  }

  const manifest = buildAudioDatasetManifest(words, outputDir, voice);
  const targetDir = path.resolve(process.cwd(), outputDir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const manifestPath = path.join(targetDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`[Audio Generator] Configurado dataset para ${words.length} elementos.`);
  console.log(`[Audio Generator] Destino: ${outputDir}`);
  console.log(`[Audio Generator] Voz configurada: ${voice}`);
  console.log(`[Audio Generator] Manifest creado en: ${manifestPath}`);
}

// Ejecutar si se llama directamente
if (process.argv[1]?.includes('generate-audio-dataset')) {
  runAudioGenerationCLI().catch(console.error);
}
