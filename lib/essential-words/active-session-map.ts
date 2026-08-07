/**
 * Maps a dueAt onto the eight-active-session forecast horizon.
 * Inactive calendar days are already omitted from `activeSessionDates`.
 */
export function mapDueAtToActiveSession(
  dueAt: Date,
  activeSessionDates: readonly Date[],
): number | null {
  if (Number.isNaN(dueAt.getTime()) || activeSessionDates.length === 0) return null;
  const dueMs = dueAt.getTime();
  for (let index = 0; index < activeSessionDates.length; index += 1) {
    if (activeSessionDates[index].getTime() >= dueMs) return index + 1;
  }
  return null;
}
