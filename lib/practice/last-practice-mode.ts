const LAST_PRACTICE_MODE_KEY = 'practice:last-mode:v1'

/**
 * Preferencia de navegación, no estado de aprendizaje. Debe permanecer fuera
 * de Dexie para que un CTA del hub no cargue todo el esquema offline.
 */
export async function setLastPracticeMode(modeId: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LAST_PRACTICE_MODE_KEY, modeId)
  } catch {
    // Private mode or disabled storage: the recommendation stays neutral.
  }
}

export async function getLastPracticeMode(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(LAST_PRACTICE_MODE_KEY)
  } catch {
    return null
  }
}
