import { unstable_cache } from "next/cache";
import { getNotionClient } from "./client";
import { Course, CourseWithLessons, NotionPage, NotionProperty, SubLesson } from "./types";

const COURSES_DB_ID = process.env.NOTION_DATABASE_ID!;

/**
 * Obtiene todos los cursos desde la Notion database.
 * Cada página de la database = un curso.
 */
async function fetchCourses(): Promise<Course[]> {
  const client = getNotionClient();
  const pages = await client.queryDatabase(COURSES_DB_ID);

  return pages.map((page: NotionPage) => {
    const title = extractPageTitle(page);
    const coverImageUrl =
      page.cover?.type === "external"
        ? page.cover.external.url
        : page.cover?.type === "file"
          ? page.cover.file.url
          : undefined;

    return {
      id: page.id,
      title,
      slug: generateSlug(title),
      description: extractRichText(page.properties?.Description?.rich_text),
      coverImageUrl,
      lessonCount: 0,
      notionPageId: page.id,
      notionUrl: page.url,
      level: normalizeLevel(page.properties?.Level?.multi_select?.[0]?.name),
      updatedAt: new Date(page.last_edited_time),
    };
  });
}

export const getCourses = unstable_cache(fetchCourses, ["notion-courses"], {
  revalidate: 3600,
  tags: ["notion-courses"],
});

/**
 * Obtiene todos los cursos con lessonCount calculado (fetches en paralelo, con caché).
 */
async function fetchCoursesWithLessonCount(): Promise<Course[]> {
  const courses = await getCourses();
  const client = getNotionClient();

  const results: Course[] = [];
  for (const course of courses) {
    try {
      const lessons = await client.extractSubLessonsFromPage(course.notionPageId);
      results.push({ ...course, lessonCount: lessons.length });
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      results.push(course);
    }
  }
  return results;
}

export const getCoursesWithLessonCount = unstable_cache(
  fetchCoursesWithLessonCount,
  ["notion-courses-with-count"],
  { revalidate: 3600, tags: ["notion-courses"] },
);

async function fetchCourseWithLessons(slug: string): Promise<CourseWithLessons | null> {
  const courses = await getCourses();
  const course = courses.find((c) => c.slug === slug);
  if (!course) return null;

  const client = getNotionClient();
  const blocks = await client.getBlockChildrenRecursive(course.notionPageId);
  const lessons = await client.extractSubLessonsFromPage(course.notionPageId, blocks);
  const lessonIds = new Set(lessons.map((l) => l.id));
  const sections = client.groupBlocksByHeading(blocks, lessonIds);

  return { ...course, lessonCount: lessons.length, lessons, sections };
}

export const getCourseWithLessons = unstable_cache(
  fetchCourseWithLessons,
  ["notion-course-with-lessons"],
  { revalidate: 3600, tags: ["notion-courses"] },
);

/**
 * Obtiene una lección específica dentro de un curso con navegación prev/next.
 */
export async function getLessonInCourse(
  courseSlug: string,
  lessonSlug: string,
): Promise<{
  lesson: SubLesson;
  course: Course;
  prev: SubLesson | null;
  next: SubLesson | null;
} | null> {
  const courseWithLessons = await getCourseWithLessons(courseSlug);
  if (!courseWithLessons) return null;

  const { lessons, ...course } = courseWithLessons;
  const index = lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) return null;

  return {
    lesson: lessons[index],
    course,
    prev: index > 0 ? lessons[index - 1] : null,
    next: index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

function extractPageTitle(page: NotionPage): string {
  const titleProp = Object.values(page.properties).find(
    (p: NotionProperty) => p.type === "title",
  );
  if (!titleProp) return "Untitled";
  return (titleProp.title ?? [])
    .map((t) => t.plain_text || "")
    .join("")
    .trim();
}

function extractRichText(richText: NotionProperty["rich_text"] | undefined): string | undefined {
  if (!richText?.length) return undefined;
  return richText.map((t) => t.plain_text || "").join("").trim() || undefined;
}

const LEVEL_MAP: Record<string, string> = {
  a1: "basic",
  a2: "basic",
  b1: "intermediate",
  b2: "intermediate",
  c1: "advanced",
  c2: "advanced",
  basic: "basic",
  intermediate: "intermediate",
  advanced: "advanced",
};

function normalizeLevel(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return LEVEL_MAP[raw.toLowerCase().trim()] ?? raw.toLowerCase().trim();
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}
