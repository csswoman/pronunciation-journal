import { NextResponse } from "next/server";
import { getCoursesWithLessonCount } from "@/lib/notion/courses";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const courses = await getCoursesWithLessonCount();
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
