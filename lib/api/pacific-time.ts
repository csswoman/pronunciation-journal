function pacificDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function getPacificDateKey(date: Date): string {
  const { year, month, day } = pacificDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getNextPacificMidnight(now: Date): Date {
  const { year, month, day } = pacificDateParts(now);
  const nextLocalDate = new Date(Date.UTC(year, month - 1, day + 1));
  const targetLocalMidnight = Date.UTC(
    nextLocalDate.getUTCFullYear(),
    nextLocalDate.getUTCMonth(),
    nextLocalDate.getUTCDate(),
  );
  let candidate = targetLocalMidnight;

  // Convert local midnight to UTC by correcting the difference between the
  // desired wall time and Intl's rendered wall time. This handles DST changes.
  for (let attempt = 0; attempt < 3; attempt++) {
    const instant = new Date(candidate);
    const rendered = pacificDateParts(instant);
    const renderedTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);
    const hour = Number(renderedTime.find((part) => part.type === "hour")?.value);
    const minute = Number(renderedTime.find((part) => part.type === "minute")?.value);
    const second = Number(renderedTime.find((part) => part.type === "second")?.value);
    const renderedWallTime = Date.UTC(rendered.year, rendered.month - 1, rendered.day, hour, minute, second);
    candidate += targetLocalMidnight - renderedWallTime;
  }
  return new Date(candidate);
}
