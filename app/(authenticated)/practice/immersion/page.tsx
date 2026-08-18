import type { Metadata } from 'next';
import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';
import { ArrowLeft, Clapperboard } from '@/components/icons';
import { ENGVID_IMMERSION_LESSONS } from '@/lib/immersion/engvid-catalog';
import { ImmersionCatalog } from '@/components/immersion/ImmersionCatalog';

export const metadata: Metadata = {
  title: 'Inmersión y Speaking | English Journal',
  description: 'Lecciones en video de profesores nativos (EngVid) con timestamps interactivos, glosarios fonéticos IPA y minería de frases.',
};

export default function ImmersionPage() {
  return (
    <PageLayout archetype="catalog">
      <div className="flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring"
          >
            <ArrowLeft className="size-4" />
            <span>Volver al Hub de Práctica</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-mono text-tiny uppercase tracking-wider font-semibold">
            <Clapperboard className="size-4" />
            <span>Inmersión con Profesores Nativos • EngVid</span>
          </div>

          <h1 className="text-display-sm font-bold text-fg md:text-display-md">
            Hub de Inmersión & Speaking
          </h1>

          <p className="max-w-2xl text-body text-fg-muted">
            Mira lecciones reales de pronunciación, entonación y fluidez. Salta a los puntos clave, guarda vocabulario con fonética IPA y mina frases auténticas para tu ciclo de repaso.
          </p>
        </div>

        {/* Catalog */}
        <ImmersionCatalog lessons={ENGVID_IMMERSION_LESSONS} />
      </div>
    </PageLayout>
  );
}
