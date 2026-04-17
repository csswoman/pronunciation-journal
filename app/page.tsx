import { getCoursesWithLessonCount } from "@/lib/notion/courses";
import SectionHeader from "@/components/layout/SectionHeader";
import CourseCard from "@/components/courses/CourseCard";
import HomeHero from "@/components/layout/HomeHero";
import PageLayout from "@/components/layout/PageLayout";

export const revalidate = 3600;

export default async function HomePage() {
  const courses = await getCoursesWithLessonCount();

  return (
    <PageLayout hero={<HomeHero />}>
      <section>
        <SectionHeader
          title="Courses"
          viewAllHref="/courses"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard key={course.id} course={course} priority={false} />
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">No courses available yet.</p>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
