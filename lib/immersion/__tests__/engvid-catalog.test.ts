import { describe, it, expect } from 'vitest';
import {
  ENGVID_IMMERSION_LESSONS,
  getImmersionLessonById,
  getImmersionLessonsByLevel,
  getImmersionLessonsByTopic,
} from '../engvid-catalog';
import { decodeHtmlEntities } from '../decode-html';
import { IMMERSION_TEACHERS, normalizeImmersionTeacher } from '../types';

describe('engvid-catalog', () => {
  it('contains valid immersion lessons with complete fields', () => {
    expect(ENGVID_IMMERSION_LESSONS.length).toBeGreaterThan(0);

    for (const lesson of ENGVID_IMMERSION_LESSONS) {
      expect(lesson.id).toBeTruthy();
      expect(lesson.youtubeVideoId).toBeTruthy();
      expect(lesson.youtubeVideoId.length).toBe(11);
      expect(lesson.title).toBeTruthy();
      expect(lesson.teacher).toBeTruthy();
      expect(lesson.teacherChannelUrl).toMatch(/^https:\/\/www\.youtube\.com/);
      expect(['A1', 'A2', 'B1', 'B2', 'C1']).toContain(lesson.level);
      expect(IMMERSION_TEACHERS).toContain(lesson.teacher);
      expect(lesson.durationMinutes).toBeGreaterThan(0);
      expect(lesson.timestamps.length).toBeGreaterThan(0);
      expect(lesson.keyVocabulary.length).toBeGreaterThan(0);
      expect(lesson.quiz.length).toBeGreaterThan(0);

      for (const vocab of lesson.keyVocabulary) {
        expect(vocab.word).toBeTruthy();
        expect(vocab.ipa).toBeTruthy();
        expect(vocab.definition).toBeTruthy();
        expect(vocab.contextSentence).toBeTruthy();
      }

      for (const q of lesson.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.explanation).toBeTruthy();
      }
    }
  });

  it('retrieves a lesson by id or slug', () => {
    const firstLesson = ENGVID_IMMERSION_LESSONS[0];
    const lesson = getImmersionLessonById(firstLesson.id);
    expect(lesson).toBeDefined();
    expect(lesson?.teacher).toBe(firstLesson.teacher);

    const bySlug = getImmersionLessonById(firstLesson.slug);
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe(firstLesson.id);
  });

  it('filters lessons by level and topic', () => {
    const b1Lessons = getImmersionLessonsByLevel('B1');
    expect(b1Lessons.length).toBeGreaterThan(0);
    expect(b1Lessons.every((l) => l.level === 'B1')).toBe(true);

    const pronunciationLessons = getImmersionLessonsByTopic('pronunciation');
    expect(pronunciationLessons.length).toBeGreaterThan(0);
    expect(pronunciationLessons.every((l) => l.topic === 'pronunciation')).toBe(true);
  });

  it('canonicalizes scraped teacher slugs to the typed union', () => {
    expect(normalizeImmersionTeacher('adam')).toBe('Adam');
    expect(normalizeImmersionTeacher('ADAM')).toBe('Adam');
    expect(normalizeImmersionTeacher('Emma')).toBe('Emma');
    expect(normalizeImmersionTeacher('unknown-teacher')).toBeNull();
  });

  it('decodes numeric HTML entities used in EngVid copy', () => {
    expect(decodeHtmlEntities('&#8220;That&#8217;ll be 66 cents please.&#8221;')).toBe(
      '“That’ll be 66 cents please.”',
    );
    expect(decodeHtmlEntities('Sikysi&#8230; what?')).toBe('Sikysi… what?');
  });

  it('does not store numeric HTML entities that look like hex colors', () => {
    for (const lesson of ENGVID_IMMERSION_LESSONS) {
      expect(JSON.stringify(lesson)).not.toMatch(/&#\d+/);
    }
  });
});
