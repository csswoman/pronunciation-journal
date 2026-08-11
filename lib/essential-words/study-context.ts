/** Learner-facing context for the first-look study step. */
export function studyContextLine(blockIndex: number, blockCount: number): string {
  if (blockCount <= 1) return "Palabra nueva";
  const block = blockIndex + 1;
  return `Palabra nueva · bloque ${block} de ${blockCount}`;
}
