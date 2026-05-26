// Parse lesson content (markdown or HTML) into TOC entries + reading metrics.
// Lightweight, no dependencies — we only need h2/h3 headings.

import { isHtmlContent } from "@/lib/theory-lessons/contentFormat";

export interface TocEntry {
  id:    string;
  text:  string;
  level: 2 | 3;
}

export interface ContentMetrics {
  toc:        TocEntry[];
  wordCount:  number;
  readTimeMin: number;
  dek:        string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const MD_HEADING = /^(#{2,3})\s+(.+?)\s*$/gm;
const HTML_HEADING = /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const HTML_TAG = /<[^>]+>/g;
const HTML_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => HTML_ENTITIES[name.toLowerCase()] ?? m);
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(HTML_TAG, " ")).replace(/\s+/g, " ").trim();
}

function getHtmlMetrics(content: string): ContentMetrics {
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = HTML_HEADING.exec(content))) {
    const level = (Number(m[1]) as 2 | 3);
    const text = stripHtml(m[2]);
    if (!text) continue;
    let id = slugify(text);
    const n = seen.get(id) ?? 0;
    if (n > 0) id = `${id}-${n}`;
    seen.set(slugify(text), n + 1);
    toc.push({ id, text, level });
  }

  const plain = stripHtml(content);
  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readTimeMin = Math.max(1, Math.round(wordCount / 220));

  const dek = extractHtmlDek(content);

  return { toc, wordCount, readTimeMin, dek };
}

function extractHtmlDek(content: string): string {
  const paragraphs = content.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi) ?? [];
  for (const raw of paragraphs) {
    const clean = stripHtml(raw);
    if (clean.length < 30) continue;
    if (clean.length <= 180) return clean;
    return clean.slice(0, 177).replace(/\s+\S*$/, "") + "…";
  }
  return "";
}

export function getContentMetrics(content: string): ContentMetrics {
  if (isHtmlContent(content)) return getHtmlMetrics(content);

  // Strip fenced code blocks so headings inside code don't pollute the TOC.
  const stripped = content.replace(/```[\s\S]*?```/g, "");

  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();
  let m: RegExpExecArray | null;
  while ((m = MD_HEADING.exec(stripped))) {
    const level = m[1].length === 2 ? 2 : 3;
    const text  = m[2].replace(/`/g, "").trim();
    let id = slugify(text);
    const n = seen.get(id) ?? 0;
    if (n > 0) id = `${id}-${n}`;
    seen.set(slugify(text), n + 1);
    toc.push({ id, text, level: level as 2 | 3 });
  }

  const words = stripped.replace(/[#*_>`\-[\]()]/g, " ").trim().split(/\s+/).filter(Boolean);
  const wordCount   = words.length;
  const readTimeMin = Math.max(1, Math.round(wordCount / 220)); // ~220 wpm

  const dek = extractDek(content);

  return { toc, wordCount, readTimeMin, dek };
}

/** Pull the first non-heading prose paragraph (under ~180 chars) for the hero dek. */
function extractDek(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith(":::") || line.startsWith(">") || line.startsWith("```")) continue;
    if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) continue;
    const clean = line
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️]/gu, "")
      .replace(/[*_`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (clean.length < 30) continue;
    if (clean.length <= 180) return clean;
    return clean.slice(0, 177).replace(/\s+\S*$/, "") + "…";
  }
  return "";
}

export function formatWordCount(n: number) {
  if (n < 1000) return `${n} words`;
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k words`;
}
