// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowingController } from '../ShadowingController';

describe('ShadowingController', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
    });

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class MockSpeechSynthesisUtterance {
        text: string;
        lang: string = 'en-US';
        rate: number = 1.0;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
    );
  });

  const passage = 'Connected speech is natural. Practice every day to improve.';

  it('renders mode switch and speed buttons', () => {
    render(<ShadowingController passageText={passage} online={true} />);

    expect(screen.getByText(/Modo Shadowing/i)).toBeInTheDocument();
    expect(screen.getByText('0.75x')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
  });

  it('starts playback when clicking Iniciar Shadowing', () => {
    render(<ShadowingController passageText={passage} online={true} />);

    const playBtn = screen.getByText(/Iniciar Shadowing/i);
    fireEvent.click(playBtn);

    expect(screen.getByText(/Escucha la pronunciación/i)).toBeInTheDocument();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('allows changing speed rate', () => {
    render(<ShadowingController passageText={passage} online={true} />);

    const slowBtn = screen.getByText('0.75x');
    fireEvent.click(slowBtn);
    expect(slowBtn).toHaveClass('bg-primary-soft');
  });
});
