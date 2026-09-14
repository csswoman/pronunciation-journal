// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChunkEvidenceSummary } from '../ChunkEvidenceSummary'

describe('ChunkEvidenceSummary', () => {
  it('does not call a chunk usable from recognition alone', () => {
    render(<ChunkEvidenceSummary evidence={{
      id: 'u:c', userId: 'u', chunkId: 'c', recognitionDays: ['2026-09-13'],
      listeningDays: [], useDays: [], pronunciationDays: [], updatedAt: '2026-09-13T12:00:00.000Z',
    }} />)
    expect(screen.getByText(/Reconocimiento observado/)).toBeInTheDocument()
    expect(screen.queryByText(/Puedes usar este chunk/)).not.toBeInTheDocument()
  })

  it('shows usable only after repeated use on distinct days', () => {
    render(<ChunkEvidenceSummary evidence={{
      id: 'u:c', userId: 'u', chunkId: 'c', recognitionDays: [], listeningDays: [],
      useDays: ['2026-09-13', '2026-09-14'], pronunciationDays: [], updatedAt: '2026-09-14T12:00:00.000Z',
    }} />)
    expect(screen.getByText(/Puedes usar este chunk/)).toBeInTheDocument()
  })

  it('labels observed intelligibility separately from acoustic accuracy', () => {
    render(<ChunkEvidenceSummary evidence={{
      id: 'u:c', userId: 'u', chunkId: 'c', recognitionDays: [], listeningDays: [],
      useDays: [], pronunciationDays: ['2026-09-13'], updatedAt: '2026-09-13T12:00:00.000Z',
    }} />)
    expect(screen.getByText(/Inteligibilidad observada en 1 día/)).toBeInTheDocument()
    expect(screen.getByText(/no equivale a un análisis acústico/)).toBeInTheDocument()
    expect(screen.queryByText(/Puedes usar este chunk/)).not.toBeInTheDocument()
  })
})
