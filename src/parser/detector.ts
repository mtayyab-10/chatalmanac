/**
 * src/parser/detector.ts
 *
 * Detects the format of a WhatsApp chat export from raw text lines.
 * Returns the detected format metadata or null if detection fails.
 * No side effects. No async. Pure functions only.
 */

import type { ParseOptions } from './types.ts';

// ─── Timestamp patterns ───────────────────────────────────────────────────────

/** Matches iOS-style: [date, time] or [date, time am/pm] */
const IOS_PATTERN =
  /^\[(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm|AM|PM)?\]/;

/** Matches Android-style: date, time am/pm -  */
const ANDROID_PATTERN =
  /^(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm|AM|PM)?\s*[-\u2013]\s*/;

/** The combined check: is this line a new message start? */
export function isMessageStart(line: string): boolean {
  return IOS_PATTERN.test(line) || ANDROID_PATTERN.test(line);
}

/** Extract the platform from the first matched line. */
function detectPlatform(firstMatchedLine: string): 'ios' | 'android' {
  return IOS_PATTERN.test(firstMatchedLine) ? 'ios' : 'android';
}

// ─── Date order detection ─────────────────────────────────────────────────────

/**
 * Infer whether dates are DMY, MDY, or YMD from the first few messages.
 *
 * Strategy:
 * - If first segment > 31  → first segment is the year  → YMD
 * - If first segment > 12  → first segment is the day   → DMY
 * - If second segment > 12 → second segment is the day  → MDY
 * - Otherwise default to DMY (most common globally in WhatsApp exports)
 */
function inferDateOrder(samples: string[]): 'dmy' | 'mdy' | 'ymd' {
  for (const sample of samples) {
    const m =
      sample.match(/^(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/) ??
      sample.match(/^\[(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (!m) continue;

    const a = parseInt(m[1]!, 10);
    const b = parseInt(m[2]!, 10);

    if (a > 31) return 'ymd';  // e.g. 2024/01/15 — year is first
    if (a > 12) return 'dmy';  // e.g. 25/01/2024 — day is first (>12)
    if (b > 12) return 'mdy';  // e.g. 01/25/2024 — month first, day second
    // Otherwise ambiguous — try next sample
  }
  // Default: DMY (most common in WhatsApp exports worldwide)
  return 'dmy';
}

// ─── Clock format detection ───────────────────────────────────────────────────

function inferClockFormat(samples: string[]): '12h' | '24h' {
  for (const sample of samples) {
    if (/\b(am|pm|AM|PM)\b/.test(sample)) return '12h';
    // If hours are 13 or above, it must be 24h
    const m = sample.match(/(?:\s|,)\s*(\d{1,2}):\d{2}/);
    if (m && parseInt(m[1]!, 10) >= 13) return '24h';
    // iOS exports always include seconds (HH:MM:SS) — if we see seconds and no AM/PM, it is 24h
    if (/\d{1,2}:\d{2}:\d{2}/.test(sample) && !/\b(am|pm|AM|PM)\b/.test(sample)) return '24h';
  }
  return '24h'; // default
}

// ─── System message detection ─────────────────────────────────────────────────

const SYSTEM_PATTERNS: RegExp[] = [
  // Group structure events (English) — these trigger hasGroupSystemMessages
  /\u202a?.+\s(added|removed|left|joined|changed the subject|was added|created|changed this group's icon|deleted this group's icon|changed the group description|pinned a message|you were added)/i,
  /Messages and calls are end-to-end encrypted/i,
  /\u202a?.+ changed their phone number/i,
  /Your security code with .+ changed/i,
  /turned on disappearing messages/i,
  /turned off disappearing messages/i,
  // Missed calls — system message but NOT a group event
  /Missed (voice|video) call/i,
  // French
  /Les messages et les appels sont chiffrés/i,
  /a quitté le groupe/i,
  /a été ajouté/i,
  // Arabic
  /\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062a \u0645\u0634\u0641\u0631\u0629/,
  // Urdu
  /\u067e\u06cc\u063a\u0627\u0645\u0627\u062a \u0627\u0648\u0631 \u06a9\u0627\u0644\u06cc\u06ba \u0627\u06cc\u0646\u0688 \u0679\u0648 \u0627\u06cc\u0646\u0688 \u0627\u06cc\u0646\u06a9\u0631\u067e\u0679\u06cc\u0688/,
];

/** Patterns that indicate a group-structure change (not just a personal system event). */
const GROUP_STRUCTURE_PATTERNS: RegExp[] = [
  /\u202a?.+\s(added|removed|left|joined|changed the subject|was added|created|changed this group's icon|deleted this group's icon|changed the group description|pinned a message|you were added)/i,
  /a quitté le groupe/i,
  /a été ajouté/i,
  // Arabic group events
  /\u0627\u0646\u0636\u0645|\u063a\u0627\u062f\u0631/,
  // Urdu group events
  /\u06af\u0631\u0648\u067e \u0645\u06cc\u06ba \u0634\u0627\u0645\u0644/,
];

export function isGroupStructureEvent(body: string): boolean {
  return GROUP_STRUCTURE_PATTERNS.some((re) => re.test(body));
}

export function isSystemMessage(body: string): boolean {
  return SYSTEM_PATTERNS.some((re) => re.test(body));
}

// ─── Media placeholder detection ─────────────────────────────────────────────

const MEDIA_PATTERNS: RegExp[] = [
  /<Media omitted>/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /document omitted/i,
  /sticker omitted/i,
  /GIF omitted/i,
  /Contact card omitted/i,
  // Arabic
  /\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0648\u0633\u0627\u0626\u0637/,
  // French
  /M\u00e9dia omis/i,
  // Urdu
  /\u0645\u06cc\u0688\u06cc\u0627 \u062e\u0627\u0631\u062c/,
];

export function isMediaPlaceholder(body: string): boolean {
  return MEDIA_PATTERNS.some((re) => re.test(body));
}

// ─── Deleted message detection ────────────────────────────────────────────────

const DELETED_PATTERNS: RegExp[] = [
  /This message was deleted/i,
  /You deleted this message/i,
  // Arabic
  /\u062a\u0645 \u062d\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629/,
  // French
  /Ce message a \u00e9t\u00e9 supprim\u00e9/i,
  // Urdu
  /\u06cc\u06c1 \u067e\u06cc\u063a\u0627\u0645 \u062d\u0630\u0641 \u06a9\u06cc\u0627 \u06af\u06cc\u0627/,
];

export function isDeletedMessage(body: string): boolean {
  return DELETED_PATTERNS.some((re) => re.test(body));
}

// ─── Chat type detection ──────────────────────────────────────────────────────

export function detectChatType(
  participants: Set<string>,
  hasGroupSystemMessages: boolean,
): 'group' | 'direct' | 'unknown' {
  if (hasGroupSystemMessages || participants.size > 2) return 'group';
  if (participants.size === 2) return 'direct';
  return 'unknown';
}

// ─── Main detector ────────────────────────────────────────────────────────────

export interface DetectionResult {
  platform: 'ios' | 'android';
  dateOrder: 'dmy' | 'mdy' | 'ymd';
  clockFormat: '12h' | '24h';
  datePattern: string;
}

/**
 * Run format detection on the first N lines of the file.
 * Returns null if no message-start lines are found.
 */
export function detectFormat(
  lines: string[],
  overrides?: ParseOptions,
): DetectionResult | null {
  // Collect up to 30 lines that look like message starts
  const candidates: string[] = [];
  for (const line of lines.slice(0, 200)) {
    if (isMessageStart(line)) {
      candidates.push(line);
      if (candidates.length >= 30) break;
    }
  }

  if (candidates.length === 0) return null;

  const firstLine = candidates[0]!;
  const platform = detectPlatform(firstLine);

  const dateOrder = overrides?.dateOrder ?? inferDateOrder(candidates);
  const clockFormat = overrides?.clockFormat ?? inferClockFormat(candidates);

  const datePattern =
    platform === 'ios'
      ? '[date, time] Sender: body'
      : 'date, time - Sender: body';

  return { platform, dateOrder, clockFormat, datePattern };
}
