import Fuse, { type IFuseOptions } from "fuse.js";
import type { ContentItem } from "./contentIndex";

const FUSE_OPTIONS: IFuseOptions<ContentItem> = {
  keys: ["title", "tags", "description"],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const TYPE_PRIORITY: Record<ContentItem["type"], number> = {
  lesson: 0,
  route: 1,
  sound: 2,
  reader: 3,
  lexicon: 4,
};

export function searchContent(query: string, index: ContentItem[]): ContentItem[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  return new Fuse(index, FUSE_OPTIONS)
    .search(normalizedQuery)
    .sort((a, b) => {
      const typeDifference = TYPE_PRIORITY[a.item.type] - TYPE_PRIORITY[b.item.type];
      return typeDifference || (a.score ?? 0) - (b.score ?? 0);
    })
    .map(({ item }) => item);
}
