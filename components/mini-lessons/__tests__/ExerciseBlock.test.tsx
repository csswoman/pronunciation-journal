// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseBlock from '../ExerciseBlock';

const propsFill = {
  instruction: 'Complete the sentences:',
  items: ['I ___ (study) English right now.', 'She ___ (drink) coffee.'],
  answers: ['am studying', 'drinks'],
};

const propsRewrite = {
  instruction: 'Rewrite with contractions:',
  items: ['I am not sure.'],
  answers: ["I'm not sure"],
};

describe('ExerciseBlock (Interactive)', () => {
  it('renders instruction and text items', () => {
    render(<ExerciseBlock {...propsFill} />);
    expect(screen.getByText('Complete the sentences:')).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
    expect(screen.getByText('She')).toBeInTheDocument();
  });

  it('allows typing and verifying a correct fill-in-the-blank answer', () => {
    render(<ExerciseBlock {...propsFill} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);

    fireEvent.change(inputs[0], { target: { value: 'am studying' } });
    fireEvent.change(inputs[1], { target: { value: 'drinks' } });

    const verifyBtn = screen.getByRole('button', { name: /Verificar/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Puntuación: 2 de 2 correctas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restablecer/i })).toBeInTheDocument();
    expect(inputs[0]).toBeDisabled();
  });

  it('shows correction hints when typing an incorrect answer', () => {
    render(<ExerciseBlock {...propsFill} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: 'study' } });
    fireEvent.change(inputs[1], { target: { value: 'drinks' } });

    const verifyBtn = screen.getByRole('button', { name: /Verificar/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Puntuación: 1 de 2 correctas/i)).toBeInTheDocument();
    // It should display the correct answer in parentheses next to the incorrect input
    expect(screen.getByText('(am studying)')).toBeInTheDocument();
  });

  it('allows verifying rewrite exercises (without blanks)', () => {
    render(<ExerciseBlock {...propsRewrite} />);
    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "i'm not sure" } });
    const verifyBtn = screen.getByRole('button', { name: /Verificar/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Puntuación: 1 de 1/i)).toBeInTheDocument();
  });

  it('resets state when clicking Restablecer', () => {
    render(<ExerciseBlock {...propsFill} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'am studying' } });

    const verifyBtn = screen.getByRole('button', { name: /Verificar/i });
    fireEvent.click(verifyBtn);

    const resetBtn = screen.getByRole('button', { name: /Restablecer/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByText(/Puntuación:/i)).not.toBeInTheDocument();
    expect(inputs[0]).not.toBeDisabled();
    expect(inputs[0]).toHaveValue('');
  });
});
