'use client'

// Planned structure:
// <ChunkTileTray>
//   <TilesGrid>
//     <TileButton key={tile.id} onClick={() => onPick(tile.id)} />
//   </TilesGrid>
// </ChunkTileTray>

import type { Tile } from '@/lib/games/chunk-duel/tokenizer'

interface ChunkTileTrayProps {
  tiles: Tile[]
  selectedTileIds: string[]
  shakeTileId: string | null
  onPick: (tileId: string) => void
}

export default function ChunkTileTray({
  tiles,
  selectedTileIds,
  shakeTileId,
  onPick,
}: ChunkTileTrayProps) {
  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-2.5 p-4 rounded-2xl bg-surface-base border border-border/40">
      {tiles.map((tile) => {
        const isPicked = selectedTileIds.includes(tile.id)
        const isShaking = shakeTileId === tile.id

        return (
          <button
            key={tile.id}
            type="button"
            disabled={isPicked}
            onClick={() => onPick(tile.id)}
            className={`px-4 py-2.5 rounded-2xl font-sans text-body-sm font-bold border-2 transition-all cursor-pointer ${
              isPicked
                ? 'opacity-20 bg-surface-card border-border/30 text-fg-muted scale-95'
                : isShaking
                ? 'bg-accent-rose/10 border-accent-rose text-accent-rose animate-bounce'
                : 'bg-surface-card border-border hover:border-primary text-fg shadow-xs hover:scale-105 active:scale-95'
            }`}
          >
            {tile.text}
          </button>
        )
      })}
    </div>
  )
}
