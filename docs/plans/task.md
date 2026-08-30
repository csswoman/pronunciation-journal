| Task | Status | Details |
| --- | --- | --- |
| 1. Domain & Types | Done | Updated `lib/journal/types.ts`, `lib/ai-prompts.ts`, added `/api/gemini/journal-pronunciation/route.ts` and `lib/journal/pronunciation-assistant.ts` |
| 2. Database Migration | Done | Added migration `supabase/migrations/20260830000000_add_pronunciation_journal_mode.sql` for `entry_mode` check constraint |
| 3. Components & Routing | Done | Updated `NotebookTodayCard`, `NotebookHomeView`, added `JournalPronunciationWrite`, updated `/journal/write/page.tsx` |
| 4. Verification & Audits | Done | All checks passed: `pnpm type-check`, `pnpm lint`, `pnpm test` (2/2 passed), `pnpm audit:hard-rules` (AI prompts, RLS, design tokens, state duplication) |
