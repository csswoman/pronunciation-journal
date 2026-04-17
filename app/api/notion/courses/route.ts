import { NextResponse } from "next/server";
import { getCoursesWithLessonCount } from "@/lib/notion/courses";

export const revalidate = 3600;

export async function GET() {
  const courses = await getCoursesWithLessonCount();
  return NextResponse.json(courses);
}
