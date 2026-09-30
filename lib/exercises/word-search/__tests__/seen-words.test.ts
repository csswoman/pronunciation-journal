import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { getRecentWordSearchWords, saveWordSearchSeenWords } from '../seen-words'

describe('word-search seen words', () => {
  afterEach(async () => {
    await db.wordSearchSeenWords.clear()
  })

  it('persists sanitized words per account, newest first', async () => {
    await saveWordSearchSeenWords('user-a', ['house'])
    await new Promise((resolve) => setTimeout(resolve, 5))
    await saveWordSearchSeenWords('user-a', ['Water!', 'house'])
    await saveWordSearchSeenWords('user-b', ['table'])

    const words = await getRecentWordSearchWords('user-a')
    expect(words).toHaveLength(2)
    expect(words).toContain('WATER')
    expect(words).not.toContain('TABLE')
  })

  it('stores guest plays under a shared guest key', async () => {
    await saveWordSearchSeenWords(null, ['chair'])
    expect(await getRecentWordSearchWords(undefined)).toEqual(['CHAIR'])
  })
})
