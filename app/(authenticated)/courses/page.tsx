import CoursePathPage from "@/components/courses/CoursePathPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCefrLevelId } from "@/lib/courses/curriculumIndex";

interface CoursesPageProps {
  searchParams: Promise<{ level?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { level } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("user_profiles").select("cefr_level").eq("id", user.id).maybeSingle()
    : { data: null };
  const maxLevel = parseCefrLevelId(profile?.cefr_level?.toLowerCase());

  return <CoursePathPage levelParam={level} maxLevel={maxLevel} />;
}
