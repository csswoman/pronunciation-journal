'use client'

// Planned structure:
// <ChunkDuelPrompt>
//   <MeaningHeadline font-heading />
//   <SelectedTokensTray />
// </ChunkDuelPrompt>

import type { ChunkDuelItem } from '@/lib/games/chunk-duel/schema'
import type { Tile } from '@/lib/games/chunk-duel/tokenizer'

interface ChunkDuelPromptProps {
  chunkItem: ChunkDuelItem
  selectedTileIds: string[]
  tiles: Tile[]
}

export default function ChunkDuelPrompt({
  chunkItem,
  selectedTileIds,
  tiles,
}: ChunkDuelPromptProps) {
  const selectedTiles = selectedTileIds.map(
    (id) => tiles.find((t) => t.id === id)!,
  )

  return (
    <div className="w-full p-6 rounded-3xl bg-surface-card border border-border text-center space-y-4 shadow-sm">
      <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
        ¿CÓMO SE DICE EN INGLÉS?
      </span>
      <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-fg">
        «{chunkItem.meaning}»
      </h2>

      {/* Slots area where picked tiles land */}
      <div className="min-h-[56px] flex flex-wrap items-center justify-center gap-2 p-3 rounded-2xl bg-surface-base border border-dashed border-border/60">
        {selectedTiles.length === 0 ? (
          <span className="font-sans text-caption text-fg-muted/60 italic">
            Toca las palabras abajo en orden...
          </span>
        ) : (
          selectedTiles.map((tile) => (
            <span
              key={tile.id}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-fg font-sans text-body-sm font-bold shadow-xs animate-in zoom-in-90 duration-150"
            >
              {tile.text}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
