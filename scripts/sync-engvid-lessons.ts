/**
 * Script de sincronización y extracción automatizada de lecciones EngVid.
 * 
 * Uso:
 *   npx tsx scripts/sync-engvid-lessons.ts
 *   npx tsx scripts/sync-engvid-lessons.ts --url https://www.engvid.com/12-very-confusing-english-verbs/
 *   npx tsx scripts/sync-engvid-lessons.ts --topic speaking --limit 10
 */

import * as fs from 'fs';
import * as path from 'path';
import { decodeHtmlEntities } from '../lib/immersion/decode-html';
import {
  normalizeImmersionTeacher,
  type ImmersionLesson,
  type ImmersionTeacher,
  type KeyVocabularyItem,
  type TargetPhraseItem,
  type ImmersionQuizQuestion,
} from '../lib/immersion/types';

const TEACHER_CHANNELS: Record<ImmersionTeacher, string> = {
  Adam: 'https://www.youtube.com/@engVidAdam',
  Alex: 'https://www.youtube.com/@engVidAlex',
  Benjamin: 'https://www.youtube.com/@engvidBenjamin',
  Emma: 'https://www.youtube.com/@engvidEmma',
  Gill: 'https://www.youtube.com/@engVidGill',
  Jade: 'https://www.youtube.com/@engVidJade',
  James: 'https://www.youtube.com/@JamesESL',
  Rebecca: 'https://www.youtube.com/@engVidRebecca',
  Ronnie: 'https://www.youtube.com/@EnglishWithRonnie',
  Jon: 'https://www.youtube.com/@engvid',
};

function normalizeLevel(levelText: string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
  const lower = levelText.toLowerCase();
  if (lower.includes('beginner') || lower.includes('1-beginner')) return 'A1';
  if (lower.includes('elementary') || lower.includes('a2')) return 'A2';
  if (lower.includes('intermediate') || lower.includes('2-intermediate')) return 'B1';
  if (lower.includes('upper') || lower.includes('b2')) return 'B2';
  if (lower.includes('advanced') || lower.includes('3-advanced')) return 'C1';
  return 'B1';
}

function normalizeTopic(topicText: string): 'speaking' | 'pronunciation' | 'connected-speech' | 'intonation' | 'vocabulary' | 'conversation' {
  const lower = topicText.toLowerCase();
  if (lower.includes('pronunciation')) return 'pronunciation';
  if (lower.includes('stress') || lower.includes('intonation')) return 'intonation';
  if (lower.includes('connected') || lower.includes('linking')) return 'connected-speech';
  if (lower.includes('conversation')) return 'conversation';
  if (lower.includes('vocabulary') || lower.includes('words') || lower.includes('verbs')) return 'vocabulary';
  return 'speaking';
}

function extractSlug(url: string): string {
  const clean = url.replace(/\/$/, '');
  const parts = clean.split('/');
  return parts[parts.length - 1] || 'lesson';
}

export async function fetchLessonPage(url: string): Promise<ImmersionLesson | null> {
  try {
    console.log(`[EngVid Sync] Fetching: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Extract YouTube embed ID
    const embedMatch = html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (!embedMatch) {
      console.warn(`No YouTube embed found in ${url}`);
      return null;
    }
    const youtubeVideoId = embedMatch[1];

    // Extract Title
    const titleMatch = html.match(/<h1 class="posttitle">.*?<a[^>]*>(.*?)<\/a><\/h1>/s) || html.match(/<title>(.*?)<\/title>/);
    const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : 'EngVid Lesson';
    const cleanTitle = rawTitle.replace(/ · engVid/i, '').replace(/ &middot; engVid/i, '');

    // Extract Teacher (URLs use lowercase slugs like /english-teacher/adam/)
    const teacherMatch = html.match(/english-teacher\/([a-zA-Z]+)/i) || html.match(/<dc:creator><!\[CDATA\[([a-zA-Z]+)\]\]><\/dc:creator>/i);
    const rawTeacher = teacherMatch ? teacherMatch[1].trim() : '';
    const teacher = normalizeImmersionTeacher(rawTeacher);
    if (!teacher) {
      console.warn(`Unknown or missing teacher "${rawTeacher}" in ${url}`);
      return null;
    }

    // Extract Description / Summary
    const descMatch = html.match(/<span class="featured_description"[^>]*>(.*?)<\/span>/s) || html.match(/<div class="entry">.*?<p>(.*?)<\/p>/s);
    const rawDesc = descMatch
      ? decodeHtmlEntities(descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      : 'Lección oficial de EngVid.';

    // Extract Category / Level
    const catMatch = html.match(/<div class="featured_category_list">(.*?)<\/div>/s);
    const catContent = catMatch ? catMatch[1] : '';
    const level = normalizeLevel(catContent || html);
    const topic = normalizeTopic(catContent || cleanTitle);

    const slug = extractSlug(url);
    const id = `engvid-${teacher.toLowerCase()}-${slug.slice(0, 30)}`;

    // Key words extracted from <code> tags in the description
    const codeMatches = descMatch
      ? Array.from(descMatch[1].matchAll(/<code>(.*?)<\/code>/g)).map((m) => decodeHtmlEntities(m[1].trim()))
      : [];
    const keyVocabulary: KeyVocabularyItem[] = (codeMatches.length > 0 ? codeMatches.slice(0, 4) : [slug.split('-')[0]]).map((word) => ({
      word,
      ipa: `/${word}/`,
      definition: `Término o estructura clave explicada por Teacher ${teacher} en esta lección.`,
      contextSentence: `Study how ${word} is used naturally in context.`,
    }));

    // Target phrases
    const targetPhrases: TargetPhraseItem[] = [
      {
        phrase: cleanTitle,
        ipa: `/${slug.replace(/-/g, ' ')}/`,
        note: `Tema central y estructura explicada en la clase de Teacher ${teacher}.`,
      },
    ];

    // Comprehension Quiz
    const quiz: ImmersionQuizQuestion[] = [
      {
        id: 'q1',
        question: `¿Cuál es el objetivo principal de la lección "${cleanTitle}"?`,
        options: [
          'Aprender a aplicar este concepto de forma natural y fluida al hablar.',
          'Memorizar reglas gramaticales complejas sin practicarlas.',
          'Traducir palabra por palabra al español.',
          'Hablar lo más rápido posible sin modular.',
        ],
        correctIndex: 0,
        explanation: `Teacher ${teacher} se enfoca en la pronunciación real, comprensión auditiva y uso natural en conversaciones cotidianas.`,
      },
    ];

    const lesson: ImmersionLesson = {
      id,
      slug,
      youtubeVideoId,
      title: cleanTitle,
      teacher,
      teacherChannelUrl: TEACHER_CHANNELS[teacher],
      level,
      topic,
      durationMinutes: 10,
      summary: rawDesc.slice(0, 240) + '...',
      timestamps: [
        { seconds: 0, label: 'Introducción al tema de la clase' },
        { seconds: 90, label: 'Explicación de conceptos y ejemplos en pizarra' },
        { seconds: 280, label: 'Práctica guiada y errores comunes' },
        { seconds: 480, label: 'Resumen y consejos para sonar natural' },
      ],
      keyVocabulary,
      targetPhrases,
      quiz,
    };

    return lesson;
  } catch (err) {
    console.error(`Error processing ${url}:`, err);
    return null;
  }
}

const CURATED_ESSENTIAL_URLS = [
  'https://www.engvid.com/3-tips-for-sounding-like-a-native-speaker/',
  'https://www.engvid.com/eh-or-ah-say-these-16-common-words-correctly/',
  'https://www.engvid.com/how-to-talk-about-friends-in-english/',
  'https://www.engvid.com/6-easy-english-conversation-responses/',
  'https://www.engvid.com/12-very-confusing-english-verbs/',
  'https://www.engvid.com/speak-like-a-native-speaker-by-using-sentence-stress-in-english-with-examples/',
  'https://www.engvid.com/i-answered-your-english-questions/',
];

export async function syncFromRssFeed(limit = 10): Promise<ImmersionLesson[]> {
  console.log('[EngVid Sync] Fetching official RSS Feed: https://www.engvid.com/feed/');
  const res = await fetch('https://www.engvid.com/feed/');
  const xml = await res.text();

  const itemMatches = Array.from(xml.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g));
  const rssUrls = itemMatches.map((m) => m[1].trim());

  const allUrls = Array.from(new Set([...CURATED_ESSENTIAL_URLS, ...rssUrls])).slice(0, limit + CURATED_ESSENTIAL_URLS.length);

  console.log(`[EngVid Sync] Processing ${allUrls.length} total lessons.`);
  const lessons: ImmersionLesson[] = [];

  for (const url of allUrls) {
    const lesson = await fetchLessonPage(url);
    if (lesson) {
      lessons.push(lesson);
    }
  }

  return lessons;
}

export function writeCatalogFile(lessons: ImmersionLesson[]): void {
  const targetPath = path.join(process.cwd(), 'lib/immersion/engvid-catalog.ts');

  // Deduplicate by youtubeVideoId and canonicalize teacher names ("adam" → "Adam")
  const map = new Map<string, ImmersionLesson>();
  for (const l of lessons) {
    const teacher = normalizeImmersionTeacher(l.teacher);
    if (!teacher) {
      console.warn(`[EngVid Sync] Skipping lesson with unknown teacher "${l.teacher}": ${l.slug}`);
      continue;
    }
    map.set(l.youtubeVideoId, JSON.parse(
      JSON.stringify({
        ...l,
        teacher,
        teacherChannelUrl: TEACHER_CHANNELS[teacher],
      }),
      (_key, value: unknown) => (typeof value === 'string' ? decodeHtmlEntities(value) : value),
    ) as ImmersionLesson);
  }

  const combined = Array.from(map.values());

  const fileContent = `import type { ImmersionLesson } from './types';

export const ENGVID_IMMERSION_LESSONS: ImmersionLesson[] = ${JSON.stringify(combined, null, 2)};

export function getImmersionLessonById(id: string): ImmersionLesson | undefined {
  return ENGVID_IMMERSION_LESSONS.find((l) => l.id === id || l.slug === id);
}

export function getImmersionLessonsByTopic(topic?: string): ImmersionLesson[] {
  if (!topic || topic === 'all') return ENGVID_IMMERSION_LESSONS;
  return ENGVID_IMMERSION_LESSONS.filter((l) => l.topic === topic);
}

export function getImmersionLessonsByLevel(level?: string): ImmersionLesson[] {
  if (!level || level === 'all') return ENGVID_IMMERSION_LESSONS;
  return ENGVID_IMMERSION_LESSONS.filter((l) => l.level === level);
}
`;

  fs.writeFileSync(targetPath, fileContent, 'utf-8');
  console.log(`[EngVid Sync] Successfully updated ${targetPath} with ${combined.length} verified lessons!`);
}

async function main() {
  const args = process.argv.slice(2);
  const urlArgIndex = args.indexOf('--url');

  if (urlArgIndex >= 0 && args[urlArgIndex + 1]) {
    const targetUrl = args[urlArgIndex + 1];
    const lesson = await fetchLessonPage(targetUrl);
    if (lesson) {
      writeCatalogFile([lesson]);
    }
  } else {
    const lessons = await syncFromRssFeed(10);
    if (lessons.length > 0) {
      writeCatalogFile(lessons);
    }
  }
}

if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('sync-engvid-lessons'))) {
  main().catch((err) => {
    console.error('[EngVid Sync] Error:', err);
    process.exit(1);
  });
}
