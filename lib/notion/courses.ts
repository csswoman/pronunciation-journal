import { getNotionClient } from "./client";
import { notionCache, cacheKeys } from "./cache";
import { Course, CourseWithLessons, SubLesson, NotionPage } from "./types";

const COURSES_DB_ID = process.env.NOTION_DATABASE_ID!;

/**
 * Obtiene todos los cursos desde la Notion database.
 * Cada página de la database = un curso.
 */
export async function getCourses(): Promise<Course[]> {
  const cacheKey = `notion:courses:${COURSES_DB_ID}`;
  const cached = notionCache.get<Course[]>(cacheKey);
  if (cached) return cached;

  const client = getNotionClient();
  const pages = await client.queryDatabase(COURSES_DB_ID);

  const courses: Course[] = pages.map((page: any) => {
    const title = extractPageTitle(page);
    return {
      id: page.id,
      title,
      slug: generateSlug(title),
      description: extractRichText(page.properties?.Description?.rich_text),
      coverImageUrl: page.cover?.external?.url ?? page.cover?.file?.url,
      lessonCount: 0,
      notionPageId: page.id,
      notionUrl: page.url,
      level: normalizeLevel(page.properties?.Level?.multi_select?.[0]?.name),
      updatedAt: new Date(page.last_edited_time),
    };
  });

  notionCache.set(cacheKey, courses);
  return courses;
}

/**
 * Obtiene todos los cursos con lessonCount calculado (fetches en paralelo, con caché).
 */
export async function getCoursesWithLessonCount(): Promise<Course[]> {
  const courses = await getCourses();
  const client = getNotionClient();

  return Promise.all(
    courses.map(async (course) => {
      const cacheKey = cacheKeys.subLessonsFromPage(course.notionPageId);
      const cached = notionCache.get<SubLesson[]>(cacheKey);
      if (cached) return { ...course, lessonCount: cached.length };

      try {
        const lessons = await client.extractSubLessonsFromPage(course.notionPageId);
        notionCache.set(cacheKey, lessons);
        return { ...course, lessonCount: lessons.length };
      } catch {
        return course;
      }
    }),
  );
}

/**
 * Obtiene un curso por slug junto con sus lecciones (toggles de Notion).
 */
export async function getCourseWithLessons(
  slug: string,
): Promise<CourseWithLessons | null> {
  const courses = await getCourses();
  const course = courses.find((c) => c.slug === slug);
  if (!course) return null;

  const cacheKey = cacheKeys.subLessonsFromPage(course.notionPageId);
  const cached = notionCache.get<SubLesson[]>(cacheKey);

  let lessons: SubLesson[];
  if (cached) {
    lessons = cached;
  } else {
    const client = getNotionClient();
    lessons = await client.extractSubLessonsFromPage(course.notionPageId);
    notionCache.set(cacheKey, lessons);
  }

  return { ...course, lessonCount: lessons.length, lessons };
}

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

function extractPageTitle(page: any): string {
  const titleProp = Object.values(page.properties as Record<string, any>).find(
    (p: any) => p.type === "title",
  );
  if (!titleProp) return "Untitled";
  return ((titleProp as any).title as any[])
    .map((t: any) => t.plain_text || "")
    .join("")
    .trim();
}

function extractRichText(richText: any[] | undefined): string | undefined {
  if (!richText?.length) return undefined;
  return richText.map((t: any) => t.plain_text || "").join("").trim() || undefined;
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
