export type ContentType = "lexicon" | "lesson" | "sound" | "route" | "reader";

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  tags: string[];
  cefr?: "A1" | "A2" | "B1" | "B2" | "C1";
  description: string;
  path: string;
};

/**
 * The generated module is refreshed by `pnpm content-index:generate`, which
 * runs before `next build`. Keeping the client-facing index as data makes this
 * function synchronous, pure, and usable by guest and signed-in sessions alike.
 */
import { CONTENT_INDEX } from "./generated-content-index";

export function getContentIndex(): ContentItem[] {
  return CONTENT_INDEX;
}
