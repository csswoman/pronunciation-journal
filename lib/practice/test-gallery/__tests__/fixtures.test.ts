import { describe, it, expect } from 'vitest'
import {
  TEST_GALLERY_ENTRIES,
  buildTestGalleryExercise,
  buildAllTestGalleryExercises,
} from '@/lib/practice/test-gallery/fixtures'

describe('test-gallery fixtures', () => {
  it('contains entries for all core and new exercises', () => {
    const ids = TEST_GALLERY_ENTRIES.map((e) => e.id)
    expect(ids).toContain('generic-fill_blank')
    expect(ids).toContain('generic-spoken_production')
    expect(ids).toContain('spoken-rodeo')
    expect(ids).toContain('spoken-transform')
    expect(ids).toContain('spoken-narrative')
    expect(ids).toContain('spoken-rapid-response')
    expect(ids).toContain('spoken-justification')
    expect(ids).toContain('phoneme-minimal_pair')
  })

  it('builds valid exercises for all entries across practice contexts', () => {
    const exercises = buildAllTestGalleryExercises('practice')
    expect(exercises.length).toBe(TEST_GALLERY_ENTRIES.length)

    for (const entry of TEST_GALLERY_ENTRIES) {
      const exercise = buildTestGalleryExercise(entry.id, 'daily')
      expect(exercise).not.toBeNull()
      expect(exercise!.id).toBeTruthy()
      expect(exercise!.slug).toBe(entry.slug)
    }
  })
})
