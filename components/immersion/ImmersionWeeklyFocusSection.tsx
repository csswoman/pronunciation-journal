'use client';

// Planned structure:
// <ImmersionWeeklyFocusSection>
//   <SectionHeader>
//     <HeadingWithBadges>
//       <SectionTitle />
//       <FocusPillTag phonemes={headerBadges[0]} />
//       <FocusPillTag topic={headerBadges[1]} />
//     </HeadingWithBadges>
//   </SectionHeader>
//   <FocusCardsGrid>
//     {focusLessons.map(({ lesson, focusTag, customChip }) => (
//       <ImmersionLessonCard key={lesson.id} lesson={lesson} progress={progressMap[lesson.id]} ... />
//     ))}
//   </FocusCardsGrid>
// </ImmersionWeeklyFocusSection>

import { useMemo } from 'react';
import { ImmersionLessonCard } from '@/components/immersion/ImmersionLessonCard';
import { rankWeakestSounds } from '@/lib/phoneme-practice/mastery-pct';
import type { ImmersionLesson, ImmersionProgressMap } from '@/lib/immersion/types';
import type { UserContrastProgress } from '@/lib/phoneme-practice/types';

interface ImmersionWeeklyFocusSectionProps {
  lessons: ImmersionLesson[];
  progressMap?: ImmersionProgressMap;
  contrastProgress?: UserContrastProgress[];
}

export function ImmersionWeeklyFocusSection({
  lessons,
  progressMap = {},
  contrastProgress = [],
}: ImmersionWeeklyFocusSectionProps) {
  // Seleccionar 4 lecciones dinámicas basadas en los fonemas/contrastes con menor dominio del usuario
  const { focusLessons, headerBadges } = useMemo(() => {
    if (lessons.length === 0) {
      return { focusLessons: [], headerBadges: ['/ɑ/ vs /ʌ/', 'pasado simple'] };
    }

    // 1. Extraer los sonidos más débiles del usuario en prácticas recientes
    const weakestRows = contrastProgress && contrastProgress.length > 0
      ? rankWeakestSounds(contrastProgress, { minAttempts: 1, limit: 4 })
      : [];

    const weakIpas = weakestRows.map((r) => r.ipa.replaceAll('/', ''));
    const primaryWeakIpa = weakIpas[0] || 'ɑ';
    const secondaryWeakIpa = weakIpas[1] || 'ʌ';

    const headerBadges = weakestRows.length >= 2
      ? [`/${primaryWeakIpa}/ vs /${secondaryWeakIpa}/`, 'enfoque activo']
      : ['/ɑ/ vs /ʌ/', 'pasado simple'];

    // 2. Buscar 4 lecciones reales del catálogo alineadas con sus puntos débiles
    const list: { lesson: ImmersionLesson; focusTag?: string; customChip?: string }[] = [];
    const usedIds = new Set<string>();

    // A) Lección que contenga el fonema débil primario en sus palabras clave
    if (weakIpas.length > 0) {
      const matchPhonemeLesson = lessons.find((l) => {
        return l.keyVocabulary.some((v) => weakIpas.some((ipa) => v.ipa?.includes(ipa)));
      });
      if (matchPhonemeLesson) {
        list.push({
          lesson: matchPhonemeLesson,
          focusTag: `TU FOCO /${primaryWeakIpa}/`,
        });
        usedIds.add(matchPhonemeLesson.id);
      }
    }

    // B) Lección de gramática / pasado simple
    const pastLesson = lessons.find(
      (l) => !usedIds.has(l.id) && (l.slug.includes('past-tense') || l.slug.includes('past-simple')),
    );
    if (pastLesson) {
      list.push({ lesson: pastLesson, focusTag: 'TU FOCO' });
      usedIds.add(pastLesson.id);
    }

    // C) Lección de modismos / phrasal verbs
    const idiomsLesson = lessons.find(
      (l) => !usedIds.has(l.id) && (l.slug.includes('10-english-idioms-with-meanings') || l.slug.includes('phrasal')),
    );
    if (idiomsLesson) {
      list.push({
        lesson: idiomsLesson,
        customChip: progressMap[idiomsLesson.id]?.watched ? '4 palabras guardadas' : undefined,
      });
      usedIds.add(idiomsLesson.id);
    }

    // D) Lección de pronunciación / sustantivos confusos
    const nounsLesson = lessons.find(
      (l) => !usedIds.has(l.id) && (l.slug.includes('confusing-english-nouns') || l.topic === 'pronunciation'),
    );
    if (nounsLesson) {
      list.push({
        lesson: nounsLesson,
        focusTag: weakIpas.length > 1 ? `TU FOCO /${secondaryWeakIpa}/` : 'TU FOCO',
      });
      usedIds.add(nounsLesson.id);
    }

    // E) Completar con las primeras lecciones no usadas si faltan para 4
    if (list.length < 4) {
      for (const l of lessons) {
        if (!usedIds.has(l.id)) {
          list.push({ lesson: l });
          usedIds.add(l.id);
          if (list.length === 4) break;
        }
      }
    }

    return { focusLessons: list.slice(0, 4), headerBadges };
  }, [lessons, progressMap, contrastProgress]);

  if (focusLessons.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5" aria-labelledby="weekly-focus-heading">
      {/* Encabezado dinámico con los focos reales del usuario */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h2
          id="weekly-focus-heading"
          className="font-display text-xl sm:text-2xl font-bold text-fg tracking-tight"
        >
          Para tus focos de esta semana
        </h2>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-3.5 py-1 text-caption font-phonetic font-medium text-fg shadow-xs">
            {headerBadges[0]}
          </span>
          <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-3.5 py-1 text-caption font-medium text-fg shadow-xs">
            {headerBadges[1]}
          </span>
        </div>
      </div>

      {/* Grid de 4 tarjetas bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {focusLessons.map(({ lesson, focusTag, customChip }) => (
          <ImmersionLessonCard
            key={lesson.id}
            lesson={lesson}
            progress={progressMap[lesson.id]}
            focusTag={focusTag}
            customChip={customChip}
          />
        ))}
      </div>
    </section>
  );
}
