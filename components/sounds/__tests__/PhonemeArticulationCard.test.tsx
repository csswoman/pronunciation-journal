// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhonemeArticulationCard } from '../PhonemeArticulationCard';
import { PHONEME_ARTICULATION_GUIDES } from '@/lib/sounds/articulation-guides';
import * as speech from '@/lib/word-bank/speech';

vi.mock('@/lib/word-bank/speech', () => ({
  speakWord: vi.fn(),
}));

describe('PhonemeArticulationCard', () => {
  const guide = PHONEME_ARTICULATION_GUIDES['/θ/'];

  it('renders phoneme symbol, name, and mechanics instructions', () => {
    render(<PhonemeArticulationCard guide={guide} />);

    expect(screen.getByText('/θ/')).toBeInTheDocument();
    expect(screen.getByText('TH Sorda (Voiceless TH)')).toBeInTheDocument();
    expect(screen.getByText(/Punta de la lengua/i)).toBeInTheDocument();
    expect(screen.getByText(/Trampa común para hispanohablantes/i)).toBeInTheDocument();
  });

  it('speaks example words on click', () => {
    render(<PhonemeArticulationCard guide={guide} />);

    const thinkBtn = screen.getByText('Think');
    fireEvent.click(thinkBtn);

    expect(speech.speakWord).toHaveBeenCalledWith('Think');
  });
});
