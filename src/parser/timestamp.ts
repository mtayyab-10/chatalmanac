/**
 * src/parser/timestamp.ts
 *
 * Converts a raw date string and time string from a WhatsApp export
 * into a Unix timestamp (milliseconds).
 *
 * Pure functions. No side effects.
 */

import type { DetectionResult } from './detector.ts';

// ─── Date part parsers ────────────────────────────────────────────────────────

function parseDateParts(
  datePart: string,
  dateOrder: 'dmy' | 'mdy' | 'ymd',
): { year: number; month: number; day: number } | null {
  const segments = datePart.split(/[\/.\-]/).map((s) => parseInt(s, 10));
  if (segments.length < 3) return null;
  const [a, b, c] = segments as [number, number, number];

  let year: number, month: number, day: number;
  if (dateOrder === 'dmy') {
    day = a; month = b; year = c;
  } else if (dateOrder === 'mdy') {
    month = a; day = b; year = c;
  } else {
    year = a; month = b; day = c;
  }

  // Expand 2-digit years: 00–49 → 2000–2049, 50–99 → 1950–1999
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return { year, month, day };
}

// ─── Time part parsers ────────────────────────────────────────────────────────

function parseTimeParts(
  timePart: string,
  ampm: string | undefined,
  clockFormat: '12h' | '24h',
): { hours: number; minutes: number; seconds: number } | null {
  const timeSegments = timePart.split(':').map((s) => parseInt(s, 10));
  if (timeSegments.length < 2) return null;

  let hours = timeSegments[0]!;
  const minutes = timeSegments[1]!;
  const seconds = timeSegments[2] ?? 0;

  if (clockFormat === '12h' && ampm) {
    const period = ampm.toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
  }

  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;

  return { hours, minutes, seconds };
}

// ─── Main timestamp parser ────────────────────────────────────────────────────

/** iOS timestamp: [DD/MM/YYYY, HH:MM:SS] or [DD/MM/YYYY, HH:MM AM] */
const IOS_TS = /^\[(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm|AM|PM)?\]/;

/** Android timestamp: DD/MM/YYYY, HH:MM AM - */
const ANDROID_TS = /^(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm|AM|PM)?\s*[-–]\s*/;

/**
 * Parse a timestamp from the start of a line.
 * Returns { timestamp, rest } where rest is the remainder of the line
 * after the timestamp prefix, or null if parsing fails.
 */
export function parseTimestamp(
  line: string,
  format: DetectionResult,
): { timestamp: number; rest: string } | null {
  const iosMatch = line.match(IOS_TS);
  const androidMatch = line.match(ANDROID_TS);
  const match = iosMatch ?? androidMatch;

  if (!match) return null;

  const [fullMatch, datePart, timePart, ampm] = match as [
    string,
    string,
    string,
    string | undefined,
  ];

  const date = parseDateParts(datePart, format.dateOrder);
  if (!date) return null;

  const time = parseTimeParts(timePart, ampm, format.clockFormat);
  if (!time) return null;

  const { year, month, day } = date;
  const { hours, minutes, seconds } = time;

  // Use UTC to avoid local timezone shifts — chats are stored in local time
  // but we want consistent relative comparisons, so we parse as local midnight UTC.
  // This means stats (hour-of-day) will reflect the user's clock, not UTC.
  const ts = Date.UTC(year, month - 1, day, hours, minutes, seconds);

  if (isNaN(ts)) return null;

  const rest = line.slice(fullMatch.length);
  return { timestamp: ts, rest };
}
