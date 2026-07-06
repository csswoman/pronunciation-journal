/** Best-effort online flag for plan builders running in the browser. */
export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
