import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { getImmersionLessonById, ENGVID_IMMERSION_LESSONS } from '@/lib/immersion/engvid-catalog';
import { ImmersionLessonDetailClient } from '@/components/immersion/ImmersionLessonDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ENGVID_IMMERSION_LESSONS.map((lesson) => ({
    slug: lesson.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getImmersionLessonById(slug);

  if (!lesson) {
    return {
      title: 'Lección no encontrada | Inmersión',
    };
  }

  return {
    title: `${lesson.title} - Teacher ${lesson.teacher} | Inmersión`,
    description: lesson.summary,
  };
}

export default async function ImmersionLessonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = getImmersionLessonById(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <PageLayout archetype="catalog">
      <ImmersionLessonDetailClient lesson={lesson} />
    </PageLayout>
  );
}
