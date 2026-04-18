import { NextResponse } from "next/server";
import { getCoursesWithLessonCount } from "@/lib/notion/courses";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const courses = await getCoursesWithLessonCount();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("[/api/notion/courses]", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
