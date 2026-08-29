| Task | Status | Details |
| --- | --- | --- |
| 1. Fix ad-hoc CTA styles in `page.tsx` | Done | Replaced hand-rolled link CTA with canonical `Button` component |
| 2. Refactor `ProgressCard.tsx` tokens & radii | Done | Updated radius to `rounded-lg` and fixed `bg-[var(--hue-icon-bg)]` to `bg-primary-soft` |
| 3. Fix tokens & accessibility in `StreakCard.tsx` | Done | Replaced `--stage-pairs` with `--accent-2`, fixed shadow, added ARIA label for `WeekDots` |
| 4. Fix touch targets & ARIA in `DailyCompletionRate.tsx` | Done | Increased range button touch targets (`min-h-[36px]`), added heatmap cell ARIA labels |
| 5. Fix tokens & SVG ARIA in `AccuracyTrend.tsx` | Done | Replaced `--warning-deco` with `--warning`, added SVG `role="img"` and `aria-label` |
| 6. Fix touch targets & tabs in `LevelConceptsProgressCard.tsx` | Done | Set level button targets to min 44px, connected tabs and tabpanels via `id` and `aria-controls` |
| 7. Fix tokens in `SkillProfileCard.tsx` & `CanSayNowCard.tsx` | Done | Replaced `--warning-deco` with `--warning`, normalized card radii to `rounded-lg` |
| 8. Remove `+XP` gamification in `ActivityHistoryCard.tsx` | Done | Removed `+{session.xpEarned} XP` text to eliminate Duolingo-style gamification |
| 9. Verification & Audits | Done | All checks passed: `pnpm type-check`, `pnpm lint`, `pnpm lint:design-tokens`, `pnpm audit:hard-rules`, `pnpm test` (683 test files, 4068 tests) |
