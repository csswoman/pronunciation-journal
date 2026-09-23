// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImmersionCatalog } from '../ImmersionCatalog';
import { LessonStudyPanel } from '../LessonStudyPanel';
import type { ImmersionLesson } from '@/lib/immersion/types';

vi.mock('@/lib/word-bank/queries', () => ({
  quickAddWord: vi.fn().mockResolvedValue({ id: 'w1' }),
}));

vi.mock('@/lib/word-bank/speech', () => ({
  speakWord: vi.fn(),
}));

const FIXTURE_LESSONS: ImmersionLesson[] = [
  {
    id: 'engvid-emma-friends',
    slug: 'how-to-talk-about-friends-in-english',
    youtubeVideoId: 'ChZJ1Q3GSuI',
    title: 'How to talk about friends in English',
    teacher: 'Emma',
    teacherChannelUrl: 'https://www.youtube.com/@engvidEmma',
    level: 'B1',
    topic: 'speaking',
    durationMinutes: 8,
    summary: 'Emma explica cómo describir amistades en inglés natural.',
    timestamps: [
      { seconds: 0, label: 'Escucha completa sin pausas' },
      { seconds: 120, label: 'Repite en voz alta con el profesor' },
    ],
    keyVocabulary: [
      { word: 'acquaintance', ipa: '/əˈkweɪntəns/', definition: 'Conocido, no un amigo cercano.', contextSentence: 'He is just an acquaintance from work.' },
    ],
    targetPhrases: [{ phrase: 'go way back', ipa: '/ɡoʊ weɪ bæk/', note: 'Conocerse desde hace mucho tiempo.' }],
    quiz: [
      { id: 'q1', question: '¿Qué significa "acquaintance"?', options: ['Conocido', 'Familiar', 'Vecino', 'Colega'], correctIndex: 0, explanation: 'Acquaintance es alguien que conoces poco.' },
    ],
  },
];

describe('ImmersionCatalog', () => {
  it('renders lesson cards from catalog', () => {
    render(<ImmersionCatalog lessons={FIXTURE_LESSONS} />);

    expect(screen.getAllByText(/Teacher/i).length).toBeGreaterThan(0);
    expect(screen.getByText(FIXTURE_LESSONS[0].title)).toBeInTheDocument();
  });

  it('renders completed badge when lesson is in completed status', () => {
    const progressMap = {
      [FIXTURE_LESSONS[0].id]: {
        lessonId: FIXTURE_LESSONS[0].id,
        watched: true,
        status: 'completed' as const,
        quizScore: 100,
      },
    };
    render(<ImmersionCatalog lessons={FIXTURE_LESSONS} progressMap={progressMap} />);

    expect(screen.getAllByText('Completada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Quiz 100%/i)).toBeInTheDocument();
    expect(screen.getByText('Repasar')).toBeInTheDocument();
  });

  it('renders in progress badge when lesson is in_progress', () => {
    const progressMap = {
      [FIXTURE_LESSONS[0].id]: {
        lessonId: FIXTURE_LESSONS[0].id,
        watched: true,
        status: 'in_progress' as const,
      },
    };
    render(<ImmersionCatalog lessons={FIXTURE_LESSONS} progressMap={progressMap} />);

    expect(screen.getAllByText('En progreso').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });

  it('filters lessons when searching', () => {
    render(<ImmersionCatalog lessons={FIXTURE_LESSONS} />);

    const firstLesson = FIXTURE_LESSONS[0];
    const input = screen.getByPlaceholderText(/Buscar por tema/i);
    fireEvent.change(input, { target: { value: firstLesson.teacher } });

    expect(screen.getAllByText(new RegExp(`Teacher ${firstLesson.teacher}`, 'i')).length).toBeGreaterThan(0);
  });

  it('paginates lessons properly when total count exceeds page size', () => {
    const manyLessons: ImmersionLesson[] = Array.from({ length: 10 }, (_, i) => ({
      ...FIXTURE_LESSONS[0],
      id: `lesson-${i + 1}`,
      slug: `lesson-${i + 1}`,
      title: `Lesson Title ${i + 1}`,
    }));

    render(<ImmersionCatalog lessons={manyLessons} />);

    // Page 1 should show initial page items and pagination controls
    expect(screen.getByText('Lesson Title 1')).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Página siguiente/i })).toBeInTheDocument();

    // Click next page
    const nextBtn = screen.getByRole('button', { name: /Página siguiente/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Página 2 de/i)).toBeInTheDocument();
  });
});

describe('LessonStudyPanel', () => {
  const sampleLesson = FIXTURE_LESSONS[0];
  const onQuizComplete = vi.fn().mockResolvedValue(undefined);

  it('renders timestamps and triggers onSeek', () => {
    const onSeek = vi.fn();
    render(<LessonStudyPanel lesson={sampleLesson} onSeek={onSeek} onQuizComplete={onQuizComplete} />);

    expect(screen.getByText(/Puntos clave/i)).toBeInTheDocument();
    expect(screen.getByText(sampleLesson.timestamps[0].label)).toBeInTheDocument();

    const timestampBtn = screen.getByText(sampleLesson.timestamps[1].label);
    fireEvent.click(timestampBtn);
    expect(onSeek).toHaveBeenCalledWith(sampleLesson.timestamps[1].seconds);
  });

  it('switches tabs to vocabulary and shows key items', () => {
    const onSeek = vi.fn();
    render(<LessonStudyPanel lesson={sampleLesson} onSeek={onSeek} onQuizComplete={onQuizComplete} />);

    const vocabTab = screen.getByText(/Vocabulario/i);
    fireEvent.click(vocabTab);

    expect(screen.getByText(sampleLesson.keyVocabulary[0].word)).toBeInTheDocument();
    expect(screen.getByText(sampleLesson.keyVocabulary[0].ipa)).toBeInTheDocument();
  });

  it('forwards the selected quiz option only after the complete quiz', () => {
    const onSeek = vi.fn();
    const recordQuiz = vi.fn().mockResolvedValue(undefined);
    const twoQuestionLesson: ImmersionLesson = {
      ...sampleLesson,
      quiz: [
        ...sampleLesson.quiz,
        { id: 'q2', question: '¿Qué es una amistad?', options: ['Una relación', 'Una ciudad'], correctIndex: 0, explanation: 'Una amistad es una relación.' },
      ],
    };
    render(<LessonStudyPanel lesson={twoQuestionLesson} onSeek={onSeek} onQuizComplete={recordQuiz} />);

    fireEvent.click(screen.getByText(/Comprobación/i));
    fireEvent.click(screen.getByRole('button', { name: 'Conocido' }));
    expect(recordQuiz).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Una relación' }));

    expect(recordQuiz).toHaveBeenCalledWith(expect.objectContaining({
      canonicalTopic: undefined,
      answers: expect.arrayContaining([
        expect.objectContaining({ questionId: 'q1', selectedAnswer: 'Conocido', isCorrect: true }),
        expect.objectContaining({ questionId: 'q2', selectedAnswer: 'Una relación', isCorrect: true }),
      ]),
    }));
  });
});
