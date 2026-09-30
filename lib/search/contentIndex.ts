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

const CONTENT_TYPES = new Set<ContentType>([
  "lexicon",
  "lesson",
  "sound",
  "route",
  "reader",
]);
const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1"]);

export const CONTENT_INDEX_ERROR_MESSAGE =
  "No se pudo cargar el contenido de búsqueda. Revisa tu conexión e inténtalo de nuevo.";

export class ContentIndexLoadError extends Error {
  constructor() {
    super(CONTENT_INDEX_ERROR_MESSAGE);
    this.name = "ContentIndexLoadError";
  }
}

let contentIndexPromise: Promise<ContentItem[]> | null = null;

function isContentItem(value: unknown): value is ContentItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.type === "string" &&
    CONTENT_TYPES.has(item.type as ContentType) &&
    typeof item.title === "string" &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === "string") &&
    typeof item.description === "string" &&
    typeof item.path === "string" &&
    (item.cefr === undefined ||
      (typeof item.cefr === "string" && CEFR_LEVELS.has(item.cefr)))
  );
}

function isContentIndex(value: unknown): value is ContentItem[] {
  return Array.isArray(value) && value.every(isContentItem);
}

async function fetchContentIndex(): Promise<ContentItem[]> {
  try {
    const response = await fetch("/search/content-index.json", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new ContentIndexLoadError();

    const data: unknown = await response.json();
    if (!isContentIndex(data)) throw new ContentIndexLoadError();
    return data;
  } catch {
    throw new ContentIndexLoadError();
  }
}

export function loadContentIndex(): Promise<ContentItem[]> {
  if (!contentIndexPromise) {
    const request = Promise.resolve().then(fetchContentIndex);
    contentIndexPromise = request.catch((error: unknown) => {
      contentIndexPromise = null;
      if (error instanceof ContentIndexLoadError) throw error;
      throw new ContentIndexLoadError();
    });
  }

  return contentIndexPromise;
}
