import { CourseSection, NotionBlock, NotionPage, NotionRichText, SubLesson, LessonTopic } from "./types";

const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";

class NotionClient {
  private token: string;

  constructor(token: string = process.env.NOTION_API_KEY || "") {
    if (!token) {
      throw new Error("NOTION_API_KEY is not set");
    }
    this.token = token;
  }

  private async fetch(url: string, options: RequestInit = {}, retries = 5) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Notion-Version": NOTION_API_VERSION,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.ok) return response.json();

      const isRetryable = [429, 502, 503, 504].includes(response.status);
      if (isRetryable && attempt < retries) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * 2 ** attempt, 8000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }
  }

  async getPageById(pageId: string): Promise<NotionPage> {
    return this.fetch(`${NOTION_BASE_URL}/pages/${pageId}`);
  }

  async getBlockChildren(blockId: string, limit = 100): Promise<NotionBlock[]> {
    const results: NotionBlock[] = [];
    let startCursor: string | undefined;

    do {
      const url = new URL(`${NOTION_BASE_URL}/blocks/${blockId}/children`);
      url.searchParams.set("page_size", Math.min(limit, 100).toString());
      if (startCursor) url.searchParams.set("start_cursor", startCursor);

      const response = await this.fetch(url.toString());
      results.push(...(response.results as NotionBlock[]));

      startCursor = response.next_cursor || undefined;

      // Avoid infinite pagination for huge pages
      if (results.length >= limit) break;
    } while (startCursor);

    return results.slice(0, limit);
  }

  async getBlockChildrenRecursive(blockId: string): Promise<NotionBlock[]> {
    const blocks = await this.getBlockChildren(blockId, 100);

    // Fetch children for blocks that have them
    const withChildren = await Promise.all(
      blocks.map(async (block) => {
        if (block.has_children) {
          const children = await this.getBlockChildrenRecursive(block.id);
          return {
            ...block,
            [block.type]: {
              ...(block[block.type] || {}),
              children,
            },
          };
        }
        return block;
      }),
    );

    return withChildren;
  }

  private getToggleRichText(block: NotionBlock): NotionRichText[] {
    if (block.type === "toggle") return block.toggle?.rich_text || [];
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    for (const h of headingTypes) {
      const heading = block[h] as { is_toggleable?: boolean; rich_text?: NotionRichText[] } | undefined;
      if (heading?.is_toggleable) return heading.rich_text || [];
    }
    return [];
  }

  private getToggleChildren(block: NotionBlock): NotionBlock[] {
    if (block.type === "toggle") return block.toggle?.children || [];
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    for (const h of headingTypes) {
      const heading = block[h] as { is_toggleable?: boolean; children?: NotionBlock[] } | undefined;
      if (heading?.is_toggleable) return heading.children || [];
    }
    return [];
  }

  private isToggleBlock(block: NotionBlock): boolean {
    if (block.type === "toggle") return true;
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    return headingTypes.some((h) => {
      const heading = block[h] as { is_toggleable?: boolean } | undefined;
      return heading?.is_toggleable ?? false;
    });
  }

  /**
   * Groups raw blocks by nearest heading_1/heading_2, returning sections with
   * their toggle-based sub-lessons. Headings without toggles create empty sections.
   */
  groupBlocksByHeading(blocks: NotionBlock[], lessonIds: Set<string>): CourseSection[] {
    const sections: CourseSection[] = [];
    let current: CourseSection | null = null;

    for (const block of blocks) {
      const isH1 = block.type === "heading_1";
      const isH2 = block.type === "heading_2";

      if (isH1 || isH2) {
        if (current) sections.push(current);
        const richText = (block[block.type] as { rich_text?: NotionRichText[] })?.rich_text ?? [];
        const title = richText.map((t) => t.plain_text || "").join("").trim();
        current = {
          id: block.id,
          title: title || (isH1 ? "Section" : "Subsection"),
          headingLevel: isH1 ? 1 : 2,
          lessonIds: [],
        };
        continue;
      }

      if (this.isToggleBlock(block) && lessonIds.has(block.id)) {
        if (!current) {
          current = { id: "ungrouped", title: "", headingLevel: 1, lessonIds: [] };
        }
        current.lessonIds.push(block.id);
      }
    }

    if (current) sections.push(current);
    return sections;
  }

  /**
   * Extract toggles from a Notion page and transform them into sub-lessons.
   * Pass pre-fetched `blocks` to avoid a redundant API call.
   */
  async extractSubLessonsFromPage(pageId: string, preloadedBlocks?: NotionBlock[]): Promise<SubLesson[]> {
    try {
      const page = await this.getPageById(pageId);
      const blocks = preloadedBlocks ?? await this.getBlockChildrenRecursive(pageId);

      const toggles = blocks.filter((block) => this.isToggleBlock(block));

      // If there are no toggles, treat the whole page as a single lesson
      if (toggles.length === 0) {
        const pageTitle = this.extractPageTitle(page);
        return [
          {
            id: pageId,
            title: pageTitle || "Lesson",
            slug: this.generateSlug(pageTitle || "lesson"),
            content: blocks,
            parentPageId: pageId,
            notionUrl: page.url,
            createdAt: new Date(page.created_time),
            updatedAt: new Date(page.last_edited_time),
          },
        ];
      }

      const subLessons: SubLesson[] = toggles.map((toggle, index) => {
        const title = this.extractPlainText(
          this.getToggleRichText(toggle),
        ).trim();

        return {
          id: toggle.id,
          title: title || `Section ${index + 1}`,
          slug: this.generateSlug(title || `section-${index + 1}`),
          content: this.getToggleChildren(toggle),
          parentPageId: pageId,
          notionUrl: page.url,
          createdAt: new Date(toggle.created_time),
          updatedAt: new Date(toggle.last_edited_time),
        };
      });

      return subLessons;
    } catch (error) {
      console.error("Error extracting sub-lessons from Notion page:", error);
      throw error;
    }
  }

  /**
   * Get all lessons (pages) from a Notion database
   */
  async getLessonsFromDatabase(databaseId: string): Promise<LessonTopic[]> {
    const url = new URL(`${NOTION_BASE_URL}/databases/${databaseId}/query`);

    try {
      const response = await this.fetch(url.toString(), {
        method: "POST",
        body: JSON.stringify({}),
      });

      const lessons: LessonTopic[] = await Promise.all(
        (response.results as NotionPage[]).map(async (page) => {
          const subLessons = await this.extractSubLessonsFromPage(page.id);
          const title = this.extractPageTitle(page);

          return {
            id: page.id,
            title,
            slug: this.generateSlug(title),
            description: undefined,
            subLessons,
            notionUrl: page.url,
          };
        }),
      );

      return lessons;
    } catch (error) {
      console.error("Error fetching lessons from Notion database:", error);
      throw error;
    }
  }

  /**
   * Query a Notion database and return its pages.
   */
  async queryDatabase(databaseId: string): Promise<NotionPage[]> {
    const response = await this.fetch(
      `${NOTION_BASE_URL}/databases/${databaseId}/query`,
      { method: "POST", body: JSON.stringify({}) },
    );
    return response.results as NotionPage[];
  }

  /**
   * Get a single lesson and its sub-lessons
   */
  async getLessonTopic(pageId: string): Promise<LessonTopic> {
    const page = await this.getPageById(pageId);
    const title = this.extractPageTitle(page);
    const subLessons = await this.extractSubLessonsFromPage(pageId);

    return {
      id: page.id,
      title,
      slug: this.generateSlug(title),
      description: undefined,
      subLessons,
      notionUrl: page.url,
    };
  }

  // Helper methods
  private extractPlainText(richText: NotionRichText[]): string {
    return richText
      .map((item) => item.plain_text || item.text?.content || "")
      .join("");
  }

  private extractPageTitle(page: NotionPage): string {
    const titleProperty = Object.values(page.properties).find(
      (prop) => prop.type === "title",
    );
    if (titleProperty?.title) {
      return this.extractPlainText(titleProperty.title);
    }
    return "Untitled";
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  }
}

// Singleton instance
let notionClient: NotionClient | null = null;

export function getNotionClient(): NotionClient {
  if (!notionClient) {
    notionClient = new NotionClient();
  }
  return notionClient;
}

export { NotionClient };
