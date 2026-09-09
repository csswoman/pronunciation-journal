import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { fetchImmersionLessonBySlugServer } from '@/lib/immersion/server-queries';
import { ImmersionLessonDetailClient } from '@/components/immersion/ImmersionLessonDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// El catálogo crece continuamente vía scripts/sync-engvid-lessons.ts, así que
// ya no se enumera en build time — cada lección se resuelve dinámicamente.

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await fetchImmersionLessonBySlugServer(slug);

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
  const lesson = await fetchImmersionLessonBySlugServer(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <PageLayout archetype="catalog">
      <ImmersionLessonDetailClient lesson={lesson} />
    </PageLayout>
  );
}
