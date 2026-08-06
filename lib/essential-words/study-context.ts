/** Learner-facing context for the first-look study step. */
export function studyContextLine(blockIndex: number, blockCount: number): string {
  const block = blockIndex + 1;
  return `Conociendo palabras nuevas · bloque ${block} de ${blockCount}`;
}
