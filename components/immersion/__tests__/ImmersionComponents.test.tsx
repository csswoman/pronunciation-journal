// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImmersionCatalog } from '../ImmersionCatalog';
import { LessonStudyPanel } from '../LessonStudyPanel';
import { ENGVID_IMMERSION_LESSONS } from '@/lib/immersion/engvid-catalog';

vi.mock('@/lib/word-bank/queries', () => ({
  quickAddWord: vi.fn().mockResolvedValue({ id: 'w1' }),
}));

vi.mock('@/lib/word-bank/speech', () => ({
  speakWord: vi.fn(),
}));

describe('ImmersionCatalog', () => {
  it('renders lesson cards from catalog', () => {
    render(<ImmersionCatalog lessons={ENGVID_IMMERSION_LESSONS} />);

    expect(screen.getAllByText(/Teacher/i).length).toBeGreaterThan(0);
    expect(screen.getByText(ENGVID_IMMERSION_LESSONS[0].title)).toBeInTheDocument();
  });

  it('filters lessons when searching', () => {
    render(<ImmersionCatalog lessons={ENGVID_IMMERSION_LESSONS} />);

    const firstLesson = ENGVID_IMMERSION_LESSONS[0];
    const input = screen.getByPlaceholderText(/Buscar por tema/i);
    fireEvent.change(input, { target: { value: firstLesson.teacher } });

    expect(screen.getAllByText(new RegExp(`Teacher ${firstLesson.teacher}`, 'i')).length).toBeGreaterThan(0);
  });
});

describe('LessonStudyPanel', () => {
  const sampleLesson = ENGVID_IMMERSION_LESSONS[0];

  it('renders timestamps and triggers onSeek', () => {
    const onSeek = vi.fn();
    render(<LessonStudyPanel lesson={sampleLesson} onSeek={onSeek} />);

    expect(screen.getByText(/Puntos clave/i)).toBeInTheDocument();
    expect(screen.getByText(sampleLesson.timestamps[0].label)).toBeInTheDocument();

    const timestampBtn = screen.getByText(sampleLesson.timestamps[1].label);
    fireEvent.click(timestampBtn);
    expect(onSeek).toHaveBeenCalledWith(sampleLesson.timestamps[1].seconds);
  });

  it('switches tabs to vocabulary and shows key items', () => {
    const onSeek = vi.fn();
    render(<LessonStudyPanel lesson={sampleLesson} onSeek={onSeek} />);

    const vocabTab = screen.getByText(/Vocabulario/i);
    fireEvent.click(vocabTab);

    expect(screen.getByText(sampleLesson.keyVocabulary[0].word)).toBeInTheDocument();
    expect(screen.getByText(sampleLesson.keyVocabulary[0].ipa)).toBeInTheDocument();
  });
});
