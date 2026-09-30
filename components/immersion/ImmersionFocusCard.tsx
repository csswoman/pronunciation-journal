'use client';

// Planned structure:
// <ImmersionFocusCard>
//   Re-exports unified ImmersionLessonCard to ensure identical layout everywhere
// </ImmersionFocusCard>

export {
  ImmersionLessonCard as ImmersionFocusCard,
  type ImmersionLessonCardProps as ImmersionFocusCardProps,
} from '@/components/immersion/ImmersionLessonCard';
