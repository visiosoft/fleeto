/**
 * RTA fines carry date_time as a display string like "19 Feb 2026, 9:57 am".
 * `new Date(...)` does not parse that reliably, so these helpers parse it
 * explicitly and let fines be sorted by their real date.
 */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse a fine date_time string into epoch milliseconds.
 * Returns 0 for missing or unparseable values, so those fines sink to the bottom.
 */
export const parseFineDateTime = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();

  const text = String(value).trim();

  // "19 Feb 2026, 9:57 am" / "19 Feb 2026 09:57"
  const match = text.match(
    /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
  );

  if (match) {
    const [, day, monthName, year, hour, minute, second, meridiem] = match;
    const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      let hours = hour ? parseInt(hour, 10) : 0;
      if (meridiem) {
        const isPm = meridiem.toLowerCase() === 'pm';
        if (isPm && hours < 12) hours += 12;
        if (!isPm && hours === 12) hours = 0;
      }
      return new Date(
        parseInt(year, 10),
        month,
        parseInt(day, 10),
        hours,
        minute ? parseInt(minute, 10) : 0,
        second ? parseInt(second, 10) : 0
      ).getTime();
    }
  }

  const fallback = new Date(text).getTime();
  return Number.isNaN(fallback) ? 0 : fallback;
};

/** Sort fines newest first, without mutating the input. */
export const sortFinesNewestFirst = <T extends { date_time?: string }>(fines: T[]): T[] =>
  [...fines].sort((a, b) => parseFineDateTime(b.date_time) - parseFineDateTime(a.date_time));
