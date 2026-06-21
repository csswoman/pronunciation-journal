export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayLocalDateKey(): string {
  return toLocalDateKey(new Date())
}

export function getRelativeLocalDateKey(offsetDays: number, baseDate: Date = new Date()): string {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + offsetDays)
  return toLocalDateKey(date)
}
