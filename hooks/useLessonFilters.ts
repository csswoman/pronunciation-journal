import { useEffect, useMemo, useState } from 'react'
import type { Lesson } from '@/lib/types'
import type { PracticeFilter } from '@/components/practice/LessonFilters'
import { PAGE_SIZE } from '@/components/practice/LessonGrid'

function categorize(lesson: Lesson): PracticeFilter[] {
  const title = lesson.title.toLowerCase()
  const categories: PracticeFilter[] = ['all']

  if (lesson.difficulty === 'easy' || lesson.category === 'basics') categories.push('basics')
  if (title.includes('diphthong')) categories.push('diphthongs')
  if (title.includes('vowel') || lesson.category === 'vowels') categories.push('vowels')
  if (title.includes('consonant') || lesson.category === 'consonants') categories.push('consonants')
  if (title.includes('/')) categories.push('vowels', 'consonants')

  return categories
}

export function useLessonFilters(allLessons: Lesson[]) {
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [gridKey, setGridKey] = useState(0)

  const filteredLessons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allLessons.filter((lesson) => {
      if (!categorize(lesson).includes(filter)) return false
      if (!query) return true
      return (
        lesson.title.toLowerCase().includes(query) ||
        lesson.description.toLowerCase().includes(query)
      )
    })
  }, [allLessons, filter, search])

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE))

  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLessons.slice(start, start + PAGE_SIZE)
  }, [filteredLessons, currentPage])

  useEffect(() => {
    setCurrentPage(1)
    setGridKey((k) => k + 1)
  }, [filter, search])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  function handlePageChange(page: number) {
    setCurrentPage(page)
    setGridKey((k) => k + 1)
  }

  return {
    filter,
    search,
    currentPage,
    totalPages,
    gridKey,
    filteredLessons,
    paginatedLessons,
    setFilter,
    setSearch,
    handlePageChange,
  }
}
