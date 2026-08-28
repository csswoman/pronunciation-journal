export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const DIFFICULTY_TO_CEFR: Record<number, CEFRLevel> = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1',
};

export function normalizeCEFR(raw: string | number): CEFRLevel {
  if (typeof raw === 'number') {
    return DIFFICULTY_TO_CEFR[raw] ?? 'B1';
  }
  const upper = raw.toUpperCase() as CEFRLevel;
  const valid: CEFRLevel[] = ['A1','A2','B1','B2','C1','C2'];
  return valid.includes(upper) ? upper : 'B1';
}

export function cefrToNumber(level: CEFRLevel): number {
  return ['A1','A2','B1','B2','C1','C2'].indexOf(level) + 1;
}

export function cefrDistance(user: CEFRLevel, exercise: CEFRLevel): number {
  return cefrToNumber(exercise) - cefrToNumber(user);
}

/**
 * Checks whether an item's CEFR level is appropriate for a learner at `userLevel`.
 * Defaults to allowing items at the user's level or ±1 level for comprehensible challenge (i+1).
 */
export function isCefrAppropriate(
  userLevel: CEFRLevel,
  itemLevel: CEFRLevel,
  maxDistance = 1,
): boolean {
  const dist = Math.abs(cefrDistance(userLevel, itemLevel));
  return dist <= maxDistance;
}

export function filterByCefrLevel<T extends { level?: CEFRLevel }>(
  items: T[],
  userLevel: CEFRLevel,
  maxDistance = 1,
): T[] {
  return items.filter((item) => {
    if (!item.level) return true;
    return isCefrAppropriate(userLevel, item.level, maxDistance);
  });
}

