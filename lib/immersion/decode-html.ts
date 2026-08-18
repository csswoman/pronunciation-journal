const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  middot: '·',
  ndash: '–',
  mdash: '—',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  hellip: '\u2026',
};

function fromCodePoint(code: number): string {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return '';
  return String.fromCodePoint(code);
}

/** Decodes numeric and common named HTML entities scraped from EngVid pages. */
export function decodeHtmlEntities(value: string): string {
  let previous = '';
  let current = value;
  while (current !== previous) {
    previous = current;
    current = current
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => fromCodePoint(Number(dec)))
      .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
  }
  return current;
}
