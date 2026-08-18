// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoutinePresetSelector } from '../RoutinePresetSelector';
import { ImmersionLogCard } from '../ImmersionLogCard';

describe('RoutinePresetSelector', () => {
  it('renders all routine presets and handles selection', () => {
    const onSelect = vi.fn();
    const onToggleSilent = vi.fn();

    render(
      <RoutinePresetSelector
        currentPreset="salas-60"
        onSelectPreset={onSelect}
        silentPeriodMode={false}
        onToggleSilentPeriod={onToggleSilent}
      />
    );

    expect(screen.getByText(/Método Mr. Salas/i)).toBeInTheDocument();
    expect(screen.getByText(/Práctica Balanceada/i)).toBeInTheDocument();
    expect(screen.getByText(/Sesión Exprés/i)).toBeInTheDocument();

    const standardBtn = screen.getByText(/Práctica Balanceada/i);
    fireEvent.click(standardBtn);
    expect(onSelect).toHaveBeenCalledWith('standard-30');
  });

  it('toggles silent period mode', () => {
    const onSelect = vi.fn();
    const onToggleSilent = vi.fn();

    render(
      <RoutinePresetSelector
        currentPreset="salas-60"
        onSelectPreset={onSelect}
        silentPeriodMode={false}
        onToggleSilentPeriod={onToggleSilent}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggleSilent).toHaveBeenCalledWith(true);
  });
});

describe('ImmersionLogCard', () => {
  it('allows selecting time and logging immersion session', () => {
    const onLog = vi.fn();

    render(<ImmersionLogCard onLogImmersion={onLog} />);

    expect(screen.getByText(/Registrar Inmersión Externa/i)).toBeInTheDocument();

    const min45Btn = screen.getByText('45 min');
    fireEvent.click(min45Btn);

    const podcastBtn = screen.getByText('Podcast');
    fireEvent.click(podcastBtn);

    const submitBtn = screen.getByText(/Registrar 45 min de Inmersión/i);
    fireEvent.click(submitBtn);

    expect(onLog).toHaveBeenCalledWith({
      type: 'podcast',
      minutes: 45,
      notes: '',
    });

    expect(screen.getByText(/¡Inmersión Registrada!/i)).toBeInTheDocument();
  });
});
