import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { getSupabaseServerUser } from '@/lib/supabase/session';
import { fetchImmersionLessonsServer, fetchUserImmersionProgressServer } from '@/lib/immersion/server-queries';
import { ImmersionCatalog } from '@/components/immersion/ImmersionCatalog';

export const metadata: Metadata = {
  title: 'Inmersión y Speaking | English Journal',
  description: 'Lecciones en video de profesores nativos (EngVid) con timestamps interactivos, glosarios fonéticos IPA y minería de frases.',
};

export default async function ImmersionPage() {
  const user = await getSupabaseServerUser();
  const [lessons, progressMap] = await Promise.all([
    fetchImmersionLessonsServer(),
    user ? fetchUserImmersionProgressServer(user.id) : Promise.resolve({}),
  ]);

  return (
    <PageLayout archetype="catalog">
      <div className="flex flex-col gap-6">
        <PageHeader
          kicker="Inmersión con Profesores Nativos"
          title="Hub de Inmersión & Speaking"
          subtitle="Mira lecciones reales de pronunciación, entonación y fluidez. Salta a los puntos clave, guarda vocabulario con fonética IPA y mina frases auténticas para tu ciclo de repaso."
        />

        <ImmersionCatalog lessons={lessons} progressMap={progressMap} />
      </div>
    </PageLayout>
  );
}
