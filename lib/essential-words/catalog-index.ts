import type { CefrLevel, EssentialWordPos } from "./types";

export interface CatalogIndexEntry {
  rank: number;
  word: string;
  pos: EssentialWordPos;
  cefr_level: CefrLevel;
  chunk: number;
  ipa_strong: string;
  ipa_weak?: string;
}

export type RawCatalogIndexTuple = [
  number,
  string,
  EssentialWordPos,
  CefrLevel,
  number,
  string,
  string?,
];

export interface RawCatalogIndex {
  version: number;
  entries: RawCatalogIndexTuple[];
}

export function parseCatalogIndex(raw: RawCatalogIndex): CatalogIndexEntry[] {
  return raw.entries.map(([rank, word, pos, cefr_level, chunk, ipa_strong, ipa_weak]) => ({
    rank,
    word,
    pos,
    cefr_level,
    chunk,
    ipa_strong,
    ipa_weak: ipa_weak ? ipa_weak : undefined,
  }));
}
