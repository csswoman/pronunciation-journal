import { NextRequest, NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion/client";
import { notionCache, cacheKeys } from "@/lib/notion/cache";

/**
 * GET /api/notion/lessons?pageId=xyz
 * Fetch sub-lessons from a Notion page (with caching)
 */
export async function GET(request: NextRequest) {
  try {
    const pageId = request.nextUrl.searchParams.get("pageId");
    const databaseId = request.nextUrl.searchParams.get("databaseId");

    if (!pageId && !databaseId) {
      return NextResponse.json(
        { error: "pageId or databaseId required" },
        { status: 400 },
      );
    }

    const client = getNotionClient();

    // Check cache first
    if (pageId) {
      const cacheKey = cacheKeys.subLessonsFromPage(pageId);
      const cached = notionCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(
          { data: cached, fromCache: true },
          { headers: { "Cache-Control": "public, s-maxage=3600" } },
        );
      }

      // Fetch and cache
      const subLessons = await client.extractSubLessonsFromPage(pageId);
      notionCache.set(cacheKey, subLessons);

      return NextResponse.json(
        { data: subLessons, fromCache: false },
        { headers: { "Cache-Control": "public, s-maxage=3600" } },
      );
    }

    if (databaseId) {
      const cacheKey = cacheKeys.lessonsFromDb(databaseId);
      const cached = notionCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(
          { data: cached, fromCache: true },
          { headers: { "Cache-Control": "public, s-maxage=3600" } },
        );
      }

      const lessons = await client.getLessonsFromDatabase(databaseId);
      notionCache.set(cacheKey, lessons);

      return NextResponse.json(
        { data: lessons, fromCache: false },
        { headers: { "Cache-Control": "public, s-maxage=3600" } },
      );
    }

    return NextResponse.json(
      { error: "No valid parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in /api/notion/lessons:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch lessons",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notion/lessons/revalidate
 * Manual cache invalidation (for webhooks from Notion)
 */
export async function POST(request: NextRequest) {
  try {
    const { pageId, databaseId } = await request.json();

    if (pageId) {
      notionCache.clearKey(cacheKeys.subLessonsFromPage(pageId));
    }
    if (databaseId) {
      notionCache.clearKey(cacheKeys.lessonsFromDb(databaseId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revalidating cache:", error);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 },
    );
  }
}
