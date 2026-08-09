/**
 * RTA fines arrive with date_time as a display string like "19 Feb 2026, 9:57 am",
 * so a Mongo sort on the raw field orders them alphabetically ("1 Mar" before "9 Feb").
 * These helpers turn that string into a timestamp so fines can be sorted by real date.
 */

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse a fine date_time string into epoch milliseconds.
 * Returns 0 when the value is missing or unparseable, so those fines sink to the bottom.
 */
function parseFineDateTime(value) {
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
}

/** Sort a list of fines newest first, without mutating the input. */
function sortFinesNewestFirst(fines) {
  return [...fines].sort(
    (a, b) => parseFineDateTime(b.date_time) - parseFineDateTime(a.date_time)
  );
}

module.exports = { parseFineDateTime, sortFinesNewestFirst };
