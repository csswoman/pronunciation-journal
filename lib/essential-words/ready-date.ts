/** YYYY-MM-DD in the local timezone of `d`. */
export function localDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addLocalDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setHours(12, 0, 0, 0)
  next.setDate(next.getDate() + days)
  return next
}
