/**
 * src/worker/stats.ts
 *
 * Pure statistics computation from ParsedMessage arrays.
 * No side effects. No async. All functions are deterministic.
 * The Web Worker imports this and calls compute().
 */

import type { ParsedMessage, ParseResult } from '../parser/types.ts';
import { getStopwords } from './stopwords.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonStats {
  name: string;
  messageCount: number;
  wordCount: number;
  charCount: number;
  sharePercent: number;
  mediaCount: number;
  linkCount: number;
  emojiCount: number;
  deletedCount: number;
  questionCount: number;
  avgMessageLength: number;
  /** Median response time in milliseconds (null if not enough data). */
  medianResponseMs: number | null;
  /** Average response time in milliseconds (null if not enough data). */
  avgResponseMs: number | null;
  /** Response time distribution buckets: [<1m, 1-5m, 5-15m, 15-60m, 1-6h, >6h] */
  responseDistribution: number[];
  topEmoji: Array<{ emoji: string; count: number }>;
}

export interface DayEntry {
  /** ISO date string YYYY-MM-DD */
  date: string;
  count: number;
}

export interface Silence {
  /** Duration in milliseconds */
  durationMs: number;
  /** Timestamp of last message before the silence */
  startTs: number;
  /** Timestamp of first message after the silence */
  endTs: number;
  /** Person who broke the silence */
  brokenBy: string;
}

export interface ConversationBoundary {
  /** Name of the person who started this conversation */
  starter: string;
  /** Name of the person who sent the last message before silence */
  ender: string;
  /** Timestamp of first message */
  startTs: number;
}

export interface YearStats {
  year: number;
  messageCount: number;
  activedays: number;
  avgPerDay: number;
}

export interface ChatStats {
  // ── Overview ──
  totalMessages: number;
  totalWords: number;
  totalChars: number;
  activeDays: number;
  /** Average messages per active day */
  avgMessagesPerDay: number;
  firstMessageTs: number;
  lastMessageTs: number;
  participants: string[];

  // ── Per-person ──
  perPerson: Map<string, PersonStats>;

  // ── Temporal activity ──
  /** Message count by hour of day (0–23) */
  hourlyActivity: number[];
  /** Message count by day of week (0=Sun…6=Sat) */
  weekdayActivity: number[];
  /** Message count by month of year (0=Jan…11=Dec) */
  monthOfYearActivity: number[];
  /** Message count by calendar month: key is "YYYY-MM" */
  monthlyTimeline: Map<string, number>;
  /** Message count by day: key is "YYYY-MM-DD" */
  calendarHeatmap: Map<string, number>;
  /** Top 10 busiest days */
  busiestDays: DayEntry[];

  // ── Streaks and silences ──
  currentStreakDays: number;
  longestStreakDays: number;
  longestSilence: Silence | null;
  /** Top 5 longest silences */
  topSilences: Silence[];

  // ── Conversations ──
  /** How many conversations each person started */
  conversationStarters: Map<string, number>;
  /** How many conversations each person ended */
  conversationEnders: Map<string, number>;

  // ── Word frequency ──
  /** Top 100 words with counts (stopwords removed) */
  wordFrequency: Array<{ word: string; count: number }>;

  // ── Emoji ──
  /** Total emoji occurrences per person */
  emojiByPerson: Map<string, number>;

  // ── Counts ──
  mediaCount: number;
  linkCount: number;
  deletedCount: number;
  questionCount: number;

  // ── Year-over-year ──
  yearlyStats: YearStats[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const EMOJI_REGEX =
  /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

const URL_REGEX =
  /https?:\/\/[^\s]+|www\.[^\s]+/gi;

const WORD_REGEX_EN = /\b[\p{L}\p{N}]{2,}\b/gu;
const WORD_REGEX_AR_UR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]{2,}/gu;

function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonthKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function countEmoji(text: string): string[] {
  return [...(text.match(EMOJI_REGEX) ?? [])];
}

function countLinks(text: string): number {
  return (text.match(URL_REGEX) ?? []).length;
}

function isQuestion(text: string): boolean {
  if (text.includes('?') || text.includes('؟')) return true;
  return /\b(who|what|when|where|why|how|is|are|was|were|did|do|does|can|could|would|will|shall|should|have|has|had|quoi|pourquoi|quand|comment|où|qui)\b/i.test(text) ||
    /(کیا|کیوں|کب|کہاں|کون|کیسے|هل|ماذا|لماذا|متى|أين|من|كيف)/u.test(text);
}

function extractWords(text: string): string[] {
  const words: string[] = [];
  // Arabic/Urdu characters
  const arUrMatches = text.match(WORD_REGEX_AR_UR) ?? [];
  words.push(...arUrMatches);
  // Latin and other scripts
  const enMatches = text.match(WORD_REGEX_EN) ?? [];
  words.push(...enMatches);
  return words;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function responseDistributionBuckets(times: number[]): number[] {
  // Buckets: <1min, 1-5min, 5-15min, 15-60min, 1-6h, >6h
  const buckets = [0, 0, 0, 0, 0, 0];
  const MIN = 60_000;
  const HOUR = 3_600_000;
  for (const t of times) {
    if (t < MIN) buckets[0]!++;
    else if (t < 5 * MIN) buckets[1]!++;
    else if (t < 15 * MIN) buckets[2]!++;
    else if (t < 60 * MIN) buckets[3]!++;
    else if (t < 6 * HOUR) buckets[4]!++;
    else buckets[5]!++;
  }
  return buckets;
}

// ─── Conversation boundary detection ─────────────────────────────────────────

/** A gap over this threshold starts a new conversation. */
const CONVERSATION_GAP_MS = 8 * 3_600_000; // 8 hours

// ─── Main compute function ────────────────────────────────────────────────────

/**
 * Compute all statistics from a ParseResult.
 * This is the only public export — the worker calls this once.
 */
export function compute(parseResult: ParseResult): ChatStats {
  const { messages, meta } = parseResult;
  const nonSystem = messages.filter((m) => !m.isSystem);

  if (nonSystem.length === 0) {
    return emptyStats(meta.participants);
  }

  // ── Detect dominant language for stopwords ──
  const stopwords = getStopwords('en');
  const arUrStopwords = new Set([...getStopwords('ar'), ...getStopwords('ur')]);

  // ── Per-person accumulators ──
  const personMap = new Map<string, {
    messages: ParsedMessage[];
    words: number;
    chars: number;
    media: number;
    links: number;
    emoji: Map<string, number>;
    deleted: number;
    questions: number;
    responseTimes: number[];
  }>();

  for (const p of meta.participants) {
    personMap.set(p, {
      messages: [],
      words: 0, chars: 0, media: 0, links: 0,
      emoji: new Map(), deleted: 0, questions: 0, responseTimes: [],
    });
  }

  // ── Temporal accumulators ──
  const hourly = new Array<number>(24).fill(0);
  const weekday = new Array<number>(7).fill(0);
  const monthOfYear = new Array<number>(12).fill(0);
  const monthlyTimeline = new Map<string, number>();
  const calendarHeatmap = new Map<string, number>();
  const activeDaySet = new Set<string>();

  // ── Word frequency ──
  const wordFreq = new Map<string, number>();

  // ── Global counts ──
  let totalWords = 0;
  let totalChars = 0;
  let mediaCount = 0;
  let linkCount = 0;
  let deletedCount = 0;
  let questionCount = 0;

  // ── Response time tracking ──
  let prevMsg: ParsedMessage | null = null;

  // ── Conversation boundaries ──
  const conversationStarters = new Map<string, number>();
  const conversationEnders = new Map<string, number>();
  let conversationActive = false;

  // ── Silences ──
  const silences: Silence[] = [];

  // ─── Main message loop ────────────────────────────────────────────────────

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    if (msg.isSystem) continue;

    const d = new Date(msg.timestamp);
    const dateKey = toDateKey(msg.timestamp);
    const monthKey = toMonthKey(msg.timestamp);

    // Temporal activity
    hourly[d.getUTCHours()]!++;
    weekday[d.getUTCDay()]!++;
    monthOfYear[d.getUTCMonth()]!++;
    monthlyTimeline.set(monthKey, (monthlyTimeline.get(monthKey) ?? 0) + 1);
    calendarHeatmap.set(dateKey, (calendarHeatmap.get(dateKey) ?? 0) + 1);
    activeDaySet.add(dateKey);

    // Silence and response time tracking
    if (prevMsg !== null) {
      const gap = msg.timestamp - prevMsg.timestamp;

      if (gap >= CONVERSATION_GAP_MS) {
        // Record silence
        silences.push({
          durationMs: gap,
          startTs: prevMsg.timestamp,
          endTs: msg.timestamp,
          brokenBy: msg.sender,
        });

        // Record ender of previous conversation
        if (prevMsg.sender) {
          conversationEnders.set(
            prevMsg.sender,
            (conversationEnders.get(prevMsg.sender) ?? 0) + 1,
          );
        }

        // Record starter of new conversation
        if (msg.sender) {
          conversationStarters.set(
            msg.sender,
            (conversationStarters.get(msg.sender) ?? 0) + 1,
          );
        }
        conversationActive = false;
      } else if (!conversationActive) {
        // First message in a new conversation
        if (msg.sender) {
          conversationStarters.set(
            msg.sender,
            (conversationStarters.get(msg.sender) ?? 0) + 1,
          );
        }
        conversationActive = true;
      }

      // Response time: only when sender changes
      if (
        msg.sender &&
        prevMsg.sender &&
        msg.sender !== prevMsg.sender &&
        gap < CONVERSATION_GAP_MS
      ) {
        const acc = personMap.get(msg.sender);
        if (acc) acc.responseTimes.push(gap);
      }
    } else {
      // Very first message — they started the conversation
      if (msg.sender) {
        conversationStarters.set(msg.sender, 1);
      }
      conversationActive = true;
    }

    prevMsg = msg;

    // Per-person stats
    const acc = msg.sender ? personMap.get(msg.sender) : undefined;
    if (acc) {
      acc.messages.push(msg);
      if (msg.isMedia) { acc.media++; mediaCount++; continue; }
      if (msg.isDeleted) { acc.deleted++; deletedCount++; continue; }

      // Text analysis
      const body = msg.body;
      acc.chars += body.length;
      totalChars += body.length;

      const links = countLinks(body);
      acc.links += links;
      linkCount += links;

      const emoji = countEmoji(body);
      for (const e of emoji) {
        acc.emoji.set(e, (acc.emoji.get(e) ?? 0) + 1);
      }

      if (isQuestion(body)) { acc.questions++; questionCount++; }

      // Strip emoji and URLs before word counting
      const cleanBody = body
        .replace(EMOJI_REGEX, ' ')
        .replace(URL_REGEX, ' ')
        .toLowerCase();

      const words = extractWords(cleanBody);
      const filteredWords = words.filter(
        (w) => !stopwords.has(w) && !arUrStopwords.has(w) && w.length >= 2,
      );

      acc.words += filteredWords.length;
      totalWords += filteredWords.length;

      for (const w of filteredWords) {
        wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
      }
    } else {
      // Sender not in participants (edge case)
      if (!msg.isMedia && !msg.isDeleted) {
        totalChars += msg.body.length;
        mediaCount += msg.isMedia ? 1 : 0;
      }
    }
  }

  // Record last conversation ender
  if (prevMsg?.sender) {
    conversationEnders.set(
      prevMsg.sender,
      (conversationEnders.get(prevMsg.sender) ?? 0) + 1,
    );
  }

  // ── Build per-person stats ──────────────────────────────────────────────────

  const totalNonSystem = nonSystem.length;
  const perPerson = new Map<string, PersonStats>();

  for (const [name, acc] of personMap) {
    const msgCount = acc.messages.length;
    const topEmoji = [...acc.emoji.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));

    const responseTimes = acc.responseTimes;

    perPerson.set(name, {
      name,
      messageCount: msgCount,
      wordCount: acc.words,
      charCount: acc.chars,
      sharePercent: totalNonSystem > 0 ? (msgCount / totalNonSystem) * 100 : 0,
      mediaCount: acc.media,
      linkCount: acc.links,
      emojiCount: [...acc.emoji.values()].reduce((a, b) => a + b, 0),
      deletedCount: acc.deleted,
      questionCount: acc.questions,
      avgMessageLength: msgCount > 0 ? acc.chars / msgCount : 0,
      medianResponseMs: responseTimes.length >= 3 ? median(responseTimes) : null,
      avgResponseMs: responseTimes.length >= 3 ? average(responseTimes) : null,
      responseDistribution: responseDistributionBuckets(responseTimes),
      topEmoji,
    });
  }

  // ── Streaks ────────────────────────────────────────────────────────────────

  const { currentStreak, longestStreak } = computeStreaks(activeDaySet);

  // ── Busiest days ──────────────────────────────────────────────────────────

  const busiestDays = [...calendarHeatmap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([date, count]) => ({ date, count }));

  // ── Silences ──────────────────────────────────────────────────────────────

  const sortedSilences = silences.sort((a, b) => b.durationMs - a.durationMs);
  const topSilences = sortedSilences.slice(0, 5);
  const longestSilence = sortedSilences[0] ?? null;

  // ── Word frequency top 100 ────────────────────────────────────────────────

  const wordFrequency = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([word, count]) => ({ word, count }));

  // ── Emoji by person ───────────────────────────────────────────────────────

  const emojiByPerson = new Map<string, number>();
  for (const [name, acc] of personMap) {
    const total = [...acc.emoji.values()].reduce((a, b) => a + b, 0);
    emojiByPerson.set(name, total);
  }

  // ── Year-over-year ────────────────────────────────────────────────────────

  const yearlyStats = computeYearlyStats(nonSystem);

  // ── Final assembly ────────────────────────────────────────────────────────

  const firstTs = nonSystem[0]!.timestamp;
  const lastTs = nonSystem[nonSystem.length - 1]!.timestamp;
  const activeDayCount = activeDaySet.size;

  return {
    totalMessages: totalNonSystem,
    totalWords,
    totalChars,
    activeDays: activeDayCount,
    avgMessagesPerDay: activeDayCount > 0 ? totalNonSystem / activeDayCount : 0,
    firstMessageTs: firstTs,
    lastMessageTs: lastTs,
    participants: meta.participants,
    perPerson,
    hourlyActivity: hourly,
    weekdayActivity: weekday,
    monthOfYearActivity: monthOfYear,
    monthlyTimeline,
    calendarHeatmap,
    busiestDays,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    longestSilence,
    topSilences,
    conversationStarters,
    conversationEnders,
    wordFrequency,
    emojiByPerson,
    mediaCount,
    linkCount,
    deletedCount,
    questionCount,
    yearlyStats,
  };
}

// ─── Streak computation ───────────────────────────────────────────────────────

function computeStreaks(activeDays: Set<string>): {
  currentStreak: number;
  longestStreak: number;
} {
  if (activeDays.size === 0) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...activeDays].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86_400_000,
    );
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  // Check if the streak is current (last active day was today or yesterday)
  const lastDay = sorted[sorted.length - 1]!;
  const today = toDateKey(Date.now());
  const yesterday = toDateKey(Date.now() - 86_400_000);
  const streakIsCurrent = lastDay === today || lastDay === yesterday;

  return {
    currentStreak: streakIsCurrent ? current : 0,
    longestStreak: longest,
  };
}

// ─── Year-over-year ───────────────────────────────────────────────────────────

function computeYearlyStats(messages: ParsedMessage[]): YearStats[] {
  const byYear = new Map<number, { count: number; days: Set<string> }>();

  for (const msg of messages) {
    const year = new Date(msg.timestamp).getUTCFullYear();
    if (!byYear.has(year)) byYear.set(year, { count: 0, days: new Set() });
    const entry = byYear.get(year)!;
    entry.count++;
    entry.days.add(toDateKey(msg.timestamp));
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, { count, days }]) => ({
      year,
      messageCount: count,
      activedays: days.size,
      avgPerDay: days.size > 0 ? count / days.size : 0,
    }));
}

// ─── Empty stats ──────────────────────────────────────────────────────────────

function emptyStats(participants: string[]): ChatStats {
  return {
    totalMessages: 0, totalWords: 0, totalChars: 0, activeDays: 0,
    avgMessagesPerDay: 0, firstMessageTs: 0, lastMessageTs: 0, participants,
    perPerson: new Map(), hourlyActivity: new Array(24).fill(0),
    weekdayActivity: new Array(7).fill(0), monthOfYearActivity: new Array(12).fill(0),
    monthlyTimeline: new Map(), calendarHeatmap: new Map(), busiestDays: [],
    currentStreakDays: 0, longestStreakDays: 0, longestSilence: null, topSilences: [],
    conversationStarters: new Map(), conversationEnders: new Map(),
    wordFrequency: [], emojiByPerson: new Map(),
    mediaCount: 0, linkCount: 0, deletedCount: 0, questionCount: 0, yearlyStats: [],
  };
}
