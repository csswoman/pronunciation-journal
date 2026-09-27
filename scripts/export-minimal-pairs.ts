import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { minimalPairsDataSchema } from '../lib/games/phoneme-invaders/schema'

async function exportMinimalPairs() {
  const targetPath = resolve(process.cwd(), 'public/games/phoneme-invaders/pairs.json')
  const content = readFileSync(targetPath, 'utf-8')
  const parsed = JSON.parse(content)
  const validated = minimalPairsDataSchema.parse(parsed)

  writeFileSync(targetPath, JSON.stringify(validated, null, 2), 'utf-8')
  console.log(`Validated and exported ${validated.length} minimal pairs to ${targetPath}`)
}

exportMinimalPairs().catch((err) => {
  console.error('Failed to export minimal pairs:', err)
  process.exit(1)
})
