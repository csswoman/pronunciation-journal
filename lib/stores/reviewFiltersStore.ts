import { create } from 'zustand'

/**
 * Ephemeral UI-only toggles for the `/practice/review` header controls.
 * Never persisted — a fresh visit always starts unfiltered.
 */
interface ReviewFiltersState {
  sortByOverdue: boolean
  onlyOverdue: boolean
  toggleSortByOverdue: () => void
  toggleOnlyOverdue: () => void
}

export const useReviewFiltersStore = create<ReviewFiltersState>((set) => ({
  sortByOverdue: false,
  onlyOverdue: false,
  toggleSortByOverdue: () => set((s) => ({ sortByOverdue: !s.sortByOverdue })),
  toggleOnlyOverdue: () => set((s) => ({ onlyOverdue: !s.onlyOverdue })),
}))
