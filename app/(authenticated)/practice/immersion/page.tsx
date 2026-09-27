import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { getSupabaseServerUser } from '@/lib/supabase/session';
import {
  fetchImmersionLessonsServer,
  fetchUserImmersionProgressServer,
  fetchUserImmersionWordsCountServer,
  fetchUserContrastProgressServer,
} from '@/lib/immersion/server-queries';
import { ImmersionCatalog } from '@/components/immersion/ImmersionCatalog';
import { GENERATED_IMMERSION_INDEX } from '@/lib/learning-loop/generated-immersion-index';
import type { ImmersionLesson, ImmersionLevel, ImmersionTeacher, ImmersionTopic } from '@/lib/immersion/types';
import type { UserContrastProgress } from '@/lib/phoneme-practice/types';

export const metadata: Metadata = {
  title: 'Ver y hablar | English Journal',
  description: 'Lecciones reales de pronunciación y fluidez. Guarda vocabulario con su IPA y saca frases para tu repaso.',
};

interface IndexEntry {
  id: string;
  slug: string;
  title: string;
  level: ImmersionLevel;
  topic: ImmersionTopic;
  metadata?: Record<string, unknown>;
}

function getFallbackLessons(): ImmersionLesson[] {
  const entries = (GENERATED_IMMERSION_INDEX ?? []) as IndexEntry[];
  return entries.map((item) => {
    let teacher: ImmersionTeacher = 'Adam';
    if (item.id.includes('-alex-')) teacher = 'Alex';
    else if (item.id.includes('-emma-')) teacher = 'Emma';
    else if (item.id.includes('-ronnie-')) teacher = 'Ronnie';
    else if (item.id.includes('-rebecca-')) teacher = 'Rebecca';
    else if (item.id.includes('-gill-')) teacher = 'Gill';
    else if (item.id.includes('-james-')) teacher = 'James';
    else if (item.id.includes('-benjamin-')) teacher = 'Benjamin';
    else if (item.id.includes('-jade-')) teacher = 'Jade';

    return {
      id: item.id,
      slug: item.slug,
      youtubeVideoId: '',
      title: item.title,
      teacher,
      teacherChannelUrl: '',
      level: item.level,
      topic: item.topic,
      durationMinutes: 12,
      summary: item.title,
      timestamps: [],
      keyVocabulary: [],
      targetPhrases: [],
      quiz: [],
      metadata: item.metadata,
    };
  });
}

export default async function ImmersionPage() {
  const user = await getSupabaseServerUser();
  let lessons: ImmersionLesson[] = [];
  let progressMap = {};
  let userWordsCount = 0;
  let contrastProgress: UserContrastProgress[] = [];

  try {
    const [fetchedLessons, fetchedProgress, wordsCount, fetchedContrasts] = await Promise.all([
      fetchImmersionLessonsServer(),
      user ? fetchUserImmersionProgressServer(user.id) : Promise.resolve({}),
      user ? fetchUserImmersionWordsCountServer(user.id) : Promise.resolve(0),
      user ? fetchUserContrastProgressServer(user.id) : Promise.resolve([]),
    ]);
    lessons = fetchedLessons;
    progressMap = fetchedProgress;
    userWordsCount = wordsCount;
    contrastProgress = fetchedContrasts;
  } catch (error) {
    console.warn('[ImmersionPage] Usando fallback local del índice de inmersión:', error);
  }

  if (lessons.length === 0) {
    lessons = getFallbackLessons();
  }

  const totalLessons = lessons.length > 0 ? lessons.length : 287;

  return (
    <PageLayout archetype="catalog">
      <div className="flex flex-col gap-6">
        <PageHeader
          kicker="INMERSIÓN CON PROFESORES NATIVOS"
          title="Ver y hablar"
          subtitle="Lecciones reales de pronunciación y fluidez. Guarda vocabulario con su IPA y saca frases para tu repaso."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-4 py-1.5 text-body-sm font-medium text-fg shadow-xs">
                <span className="font-semibold">{totalLessons}</span>&nbsp;lecciones
              </span>
              <span className="inline-flex items-center rounded-full bg-mint border border-ink/10 px-4 py-1.5 text-body-sm font-semibold text-ink shadow-xs">
                <strong className="mr-1 font-bold text-ink">{userWordsCount}</strong> palabras tuyas de aquí
              </span>
            </div>
          }
        />

        <ImmersionCatalog
          lessons={lessons}
          progressMap={progressMap}
          contrastProgress={contrastProgress}
          initialFocusOnly={true}
        />
      </div>
    </PageLayout>
  );
}
