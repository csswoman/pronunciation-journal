// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

import { db } from '@/lib/db';
import { markImmersionLessonWatched } from '../progress-queries';

describe('markImmersionLessonWatched', () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
    from.mockReset();
  });

  afterEach(() => db.close());

  it('writes local progress and enqueues an outbox upsert, without calling Supabase', async () => {
    await markImmersionLessonWatched('user-1', 'lesson-1', 85);

    const record = await db.immersionLessonProgress.get('user-1:lesson-1');
    expect(record).toMatchObject({
      userId: 'user-1',
      lessonId: 'lesson-1',
      watched: true,
      quizScore: 85,
    });

    const allEntries = await db.syncOutbox.toArray();
    const outboxEntries = allEntries.filter((entry) => entry.table === 'immersion_lesson_progress');
    expect(outboxEntries).toHaveLength(1);
    expect(outboxEntries[0]).toMatchObject({
      table: 'immersion_lesson_progress',
      operation: 'upsert',
      userId: 'user-1',
      onConflict: 'user_id,lesson_id',
      payload: expect.objectContaining({
        user_id: 'user-1',
        lesson_id: 'lesson-1',
        watched: true,
        quiz_score: 85,
      }),
    });

    expect(from).not.toHaveBeenCalled();
  });
});
