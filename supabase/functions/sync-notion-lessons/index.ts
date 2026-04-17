/**
 * sync-notion-lessons — Supabase Edge Function
 *
 * Reads pages from a Notion database and upserts them into theory_lessons.
 * Only callable by admins (verified via user JWT + user_profiles.role check).
 *
 * Required env vars (Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL               — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — bypasses RLS for upsert
 *   NOTION_API_KEY             — Internal Integration Secret
 *   NOTION_DATABASE_ID         — ID of the Notion lessons database
 *
 * Notion database expected properties:
 *   Name   (title)  — lesson title (auto-detected by type)
 *   Level  (select) — e.g. "B1", "Grammar", "Advanced" → mapped to LessonCategory
 *   Cover  (files)  — optional cover image (page cover also works)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

interface NotionPage {
  id: string;
  last_edited_time: string;
  properties: Record<string, NotionProperty>;
  cover: { type: string; external?: { url: string }; file?: { url: string } } | null;
}

interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  select?: { name: string } | null;
  checkbox?: boolean;
  files?: Array<{ type: string; external?: { url: string }; file?: { url: string } }>;
  rich_text?: Array<{ plain_text: string }>;
}

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

// ── Notion API helpers ────────────────────────────────────────────────────────

async function notionFetch(path: string, apiKey: string, options: RequestInit = {}) {
  const res = await fetch(`${NOTION_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function queryDatabase(databaseId: string, apiKey: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = await notionFetch(
      `/databases/${databaseId}/query`,
      apiKey,
      { method: "POST", body: JSON.stringify(body) }
    );

    pages.push(...(data.results as NotionPage[]));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function getBlocks(pageId: string, apiKey: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const params = cursor ? `?start_cursor=${cursor}` : "";
    const data = await notionFetch(`/blocks/${pageId}/children${params}`, apiKey);
    blocks.push(...(data.results as NotionBlock[]));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  // Recursively fetch children for blocks that have them
  const expanded: NotionBlock[] = [];
  for (const block of blocks) {
    expanded.push(block);
    if (block.has_children && ["bulleted_list_item", "numbered_list_item", "toggle", "quote", "callout"].includes(block.type)) {
      const children = await getBlocks(block.id, apiKey);
      expanded.push(...children);
    }
  }
  return expanded;
}

// ── Notion blocks → Markdown ──────────────────────────────────────────────────

function richTextToMd(items: Array<{ plain_text: string; annotations?: Record<string, boolean>; href?: string | null }>): string {
  return items.map((item) => {
    let text = item.plain_text;
    if (item.annotations?.code) text = `\`${text}\``;
    if (item.annotations?.bold) text = `**${text}**`;
    if (item.annotations?.italic) text = `*${text}*`;
    if (item.href) text = `[${text}](${item.href})`;
    return text;
  }).join("");
}

function blockToMarkdown(block: NotionBlock): string {
  const b = block as Record<string, unknown>;

  switch (block.type) {
    case "heading_1": {
      const rt = (b.heading_1 as { rich_text: [] }).rich_text;
      return `# ${richTextToMd(rt)}\n`;
    }
    case "heading_2": {
      const rt = (b.heading_2 as { rich_text: [] }).rich_text;
      return `## ${richTextToMd(rt)}\n`;
    }
    case "heading_3": {
      const rt = (b.heading_3 as { rich_text: [] }).rich_text;
      return `### ${richTextToMd(rt)}\n`;
    }
    case "paragraph": {
      const rt = (b.paragraph as { rich_text: [] }).rich_text;
      const text = richTextToMd(rt);
      return text ? `${text}\n` : "\n";
    }
    case "bulleted_list_item": {
      const rt = (b.bulleted_list_item as { rich_text: [] }).rich_text;
      return `- ${richTextToMd(rt)}\n`;
    }
    case "numbered_list_item": {
      const rt = (b.numbered_list_item as { rich_text: [] }).rich_text;
      return `1. ${richTextToMd(rt)}\n`;
    }
    case "quote": {
      const rt = (b.quote as { rich_text: [] }).rich_text;
      return `> ${richTextToMd(rt)}\n`;
    }
    case "callout": {
      const rt = (b.callout as { rich_text: []; icon?: { emoji?: string } }).rich_text;
      const icon = (b.callout as { icon?: { emoji?: string } }).icon?.emoji ?? "💡";
      return `> ${icon} ${richTextToMd(rt)}\n`;
    }
    case "code": {
      const rt = (b.code as { rich_text: []; language: string }).rich_text;
      const lang = (b.code as { language: string }).language ?? "";
      return `\`\`\`${lang}\n${richTextToMd(rt)}\n\`\`\`\n`;
    }
    case "divider":
      return "---\n";
    case "image": {
      const img = b.image as { type: string; external?: { url: string }; file?: { url: string }; caption?: [] };
      const url = img.type === "external" ? img.external?.url : img.file?.url;
      const caption = img.caption ? richTextToMd(img.caption) : "";
      return url ? `![${caption}](${url})\n` : "";
    }
    case "table_of_contents":
      return "";
    default:
      return "";
  }
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  return blocks.map(blockToMarkdown).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Property extractors ───────────────────────────────────────────────────────

function getTitle(page: NotionPage): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title?.length) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "Untitled";
}

function getSelect(page: NotionPage, propName: string): string | null {
  const prop = page.properties[propName];
  if (prop?.type === "select" && prop.select) return prop.select.name;
  return null;
}

/** Maps Notion "level" select values to LessonCategory */
function mapLevel(raw: string | null): string {
  if (!raw) return "general";
  const map: Record<string, string> = {
    a1: "a1", a2: "a2", b1: "b1", b2: "b2", c1: "c1",
    beginner: "a1", elementary: "a2", intermediate: "b1",
    "upper intermediate": "b2", advanced: "c1",
    phonetics: "phonetics", grammar: "grammar",
    vocabulary: "vocabulary", spelling: "spelling", general: "general",
  };
  return map[raw.toLowerCase()] ?? "general";
}


function getCoverUrl(page: NotionPage): string | null {
  if (!page.cover) return null;
  if (page.cover.type === "external") return page.cover.external?.url ?? null;
  if (page.cover.type === "file") return page.cover.file?.url ?? null;
  return null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const notionApiKey = Deno.env.get("NOTION_API_KEY")!;
  const notionDatabaseId = Deno.env.get("NOTION_DATABASE_ID")!;

  if (!notionApiKey || !notionDatabaseId) {
    return new Response(JSON.stringify({ error: "Missing Notion env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify caller is an admin via their JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "premium") {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log sync start
  const { data: syncLog } = await supabase
    .from("notion_sync_log")
    .insert({ status: "running" })
    .select()
    .single();
  const logId = syncLog?.id;

  let created = 0;
  let updated = 0;
  const skipped = 0;
  let errorMessage: string | null = null;

  try {
    const pages = await queryDatabase(notionDatabaseId, notionApiKey);

    for (const page of pages) {
      const title = getTitle(page);
      const category = mapLevel(getSelect(page, "Level"));
      const isPublished = true;
      const coverUrl = getCoverUrl(page);
      const notionLastEdited = page.last_edited_time;

      // Check if already exists (always update, don't skip based on timestamp)
      const { data: existing } = await supabase
        .from("theory_lessons")
        .select("id")
        .eq("notion_page_id", page.id)
        .maybeSingle();

      // Fetch page content and convert to Markdown
      const blocks = await getBlocks(page.id, notionApiKey);
      const content = blocksToMarkdown(blocks);
      const slug = slugify(title);

      const lessonData = {
        title,
        slug,
        content,
        category,
        cover_image_url: coverUrl,
        is_published: isPublished,
        is_system: true,
        source: "notion",
        notion_page_id: page.id,
        notion_last_edited: notionLastEdited,
        notion_synced_at: new Date().toISOString(),
        user_id: null,
      };

      if (existing) {
        await supabase
          .from("theory_lessons")
          .update(lessonData)
          .eq("id", existing.id);
        updated++;
      } else {
        await supabase
          .from("theory_lessons")
          .insert(lessonData);
        created++;
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error("sync-notion-lessons error:", errorMessage);

    if (logId) {
      await supabase
        .from("notion_sync_log")
        .update({ status: "error", finished_at: new Date().toISOString(), error_message: errorMessage })
        .eq("id", logId);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update sync log
  if (logId) {
    await supabase
      .from("notion_sync_log")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        lessons_created: created,
        lessons_updated: updated,
        lessons_skipped: skipped,
      })
      .eq("id", logId);
  }

  const result = { created, updated, skipped };
  console.log("sync-notion-lessons result:", JSON.stringify(result));

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
