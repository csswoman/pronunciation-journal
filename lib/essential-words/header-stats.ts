export function essentialWordsHeaderStatsLine(
  learned: number,
  totalWords: number,
  dueCount: number,
): string {
  if (learned > 0) {
    return `${learned} de ${totalWords} palabras en curso`;
  }
  if (dueCount > 0) {
    return dueCount === 1
      ? "1 repaso pendiente"
      : `${dueCount} repasos pendientes`;
  }
  if (totalWords === 1) {
    return "1 palabra lista para practicar";
  }
  if (totalWords > 0) {
    return `${totalWords} palabras listas para practicar`;
  }
  return "Preparando tu mazo de palabras";
}
