// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

import { db } from '@/lib/db';
import {
  markImmersionLessonWatched,
  recordImmersionQuizAttempt,
  recordImmersionQuizScore,
} from '../progress-queries';

describe('markImmersionLessonWatched', () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
    from.mockReset();
  });

  afterEach(() => db.close());

  it('writes local progress and enqueues an outbox upsert, without calling Supabase', async () => {
    await markImmersionLessonWatched('user-1', 'lesson-1');

    const record = await db.immersionLessonProgress.get('user-1:lesson-1');
    expect(record).toMatchObject({
      userId: 'user-1',
      lessonId: 'lesson-1',
      watched: true,
      quizScore: undefined,
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
        quiz_score: null,
      }),
    });

    expect(from).not.toHaveBeenCalled();
  });

  it('keeps quiz and watched state independent in either order', async () => {
    await recordImmersionQuizScore('user-1', 'quiz-first', 70);
    await markImmersionLessonWatched('user-1', 'quiz-first');
    await markImmersionLessonWatched('user-1', 'watched-first');
    await recordImmersionQuizScore('user-1', 'watched-first', 90);

    expect(await db.immersionLessonProgress.get('user-1:quiz-first')).toMatchObject({ watched: true, quizScore: 70 });
    expect(await db.immersionLessonProgress.get('user-1:watched-first')).toMatchObject({ watched: true, quizScore: 90 });
  });

  it('records each selected option once and one stable activity session per completed attempt', async () => {
    const input = {
      attemptId: 'immersion-attempt-1',
      lessonId: 'lesson-1',
      canonicalTopic: 'a1-present-simple-routines',
      answers: [
        { questionId: 'q1', question: 'Q1', selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeMs: 100 },
        { questionId: 'q2', question: 'Q2', selectedAnswer: 'B', correctAnswer: 'C', isCorrect: false, timeMs: 200 },
      ],
    };

    await recordImmersionQuizAttempt('user-1', input);
    await recordImmersionQuizAttempt('user-1', input);

    const entries = await db.syncOutbox.toArray();
    const answers = entries.filter((entry) => entry.table === 'answer_history');
    const sessions = entries.filter((entry) => entry.table === 'activity_sessions');
    expect(answers).toHaveLength(2);
    expect(answers.map((entry) => entry.payload)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'immersion-attempt-1:q1', user_answer: 'A', is_correct: true }),
      expect.objectContaining({ id: 'immersion-attempt-1:q2', user_answer: 'B', is_correct: false }),
    ]));
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.payload).toMatchObject({ id: 'immersion-attempt-1', source: 'immersion' });
  });

  it('does not attribute answers without a canonical topic', async () => {
    await recordImmersionQuizAttempt('user-1', {
      attemptId: 'untargeted-attempt',
      lessonId: 'lesson-without-topic',
      answers: [{ questionId: 'q1', question: 'Q1', selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeMs: 100 }],
    });

    const answer = (await db.syncOutbox.toArray()).find((entry) => entry.table === 'answer_history');
    expect(answer?.payload.topic).toBeNull();
  });

  it('keeps a deliberate quiz retry as a distinct attempt', async () => {
    const answers = [{ questionId: 'q1', question: 'Q1', selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeMs: 100 }];
    await recordImmersionQuizAttempt('user-1', { attemptId: 'attempt-one', lessonId: 'lesson-1', answers });
    await recordImmersionQuizAttempt('user-1', { attemptId: 'attempt-two', lessonId: 'lesson-1', answers });

    const sessions = (await db.syncOutbox.toArray()).filter((entry) => entry.table === 'activity_sessions');
    expect(sessions.map((entry) => entry.payload.id)).toEqual(['attempt-one', 'attempt-two']);
  });
});
