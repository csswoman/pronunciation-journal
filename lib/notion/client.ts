import { NotionBlock, NotionPage, SubLesson, LessonTopic } from "./types";

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

  private async fetch(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }

    return response.json();
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

  private getToggleRichText(block: NotionBlock): any[] {
    if (block.type === "toggle") return block.toggle?.rich_text || [];
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    for (const h of headingTypes) {
      const heading = block[h] as any;
      if (heading?.is_toggleable) return heading.rich_text || [];
    }
    return [];
  }

  private getToggleChildren(block: NotionBlock): NotionBlock[] {
    if (block.type === "toggle") return block.toggle?.children || [];
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    for (const h of headingTypes) {
      const heading = block[h] as any;
      if (heading?.is_toggleable) return heading.children || [];
    }
    return [];
  }

  private isToggleBlock(block: NotionBlock): boolean {
    if (block.type === "toggle") return true;
    const headingTypes = ["heading_1", "heading_2", "heading_3"] as const;
    return headingTypes.some((h) => (block[h] as any)?.is_toggleable);
  }

  /**
   * Extract toggles from a Notion page and transform them into sub-lessons
   */
  async extractSubLessonsFromPage(pageId: string): Promise<SubLesson[]> {
    try {
      const page = await this.getPageById(pageId);
      const blocks = await this.getBlockChildrenRecursive(pageId);

      console.log(`[Notion] pageId=${pageId} — total blocks: ${blocks.length}`);
      console.log(`[Notion] block types:`, blocks.map((b) => ({
        type: b.type,
        has_children: b.has_children,
        id: b.id.slice(0, 8),
        is_toggleable: (b[b.type] as any)?.is_toggleable ?? undefined,
        text: (b[b.type] as any)?.rich_text?.[0]?.plain_text?.slice(0, 40) ?? "",
      })));

      const toggles = blocks.filter((block) => this.isToggleBlock(block));
      console.log(`[Notion] toggles found: ${toggles.length}`);

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
  private extractPlainText(richText: any[]): string {
    return richText
      .map((item) => item.plain_text || item.text?.content || "")
      .join("");
  }

  private extractPageTitle(page: NotionPage): string {
    const titleProperty = Object.values(page.properties).find(
      (prop) => prop.type === "title",
    );
    if (titleProperty && "title" in titleProperty) {
      return this.extractPlainText((titleProperty as any).title);
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
