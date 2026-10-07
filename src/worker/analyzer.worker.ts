/**
 * src/worker/analyzer.worker.ts
 *
 * Web Worker that runs parsing and statistics computation off the main thread.
 * The main thread sends a file (text or zip) and receives progress events
 * followed by a final result or error.
 *
 * Message protocol:
 *   Main → Worker: { type: 'analyze', payload: { text: string, options?: ParseOptions } }
 *   Worker → Main: { type: 'progress', payload: ProgressEvent }
 *   Worker → Main: { type: 'result',   payload: SerializedStats }
 *   Worker → Main: { type: 'error',    payload: ParseError }
 */

import { parseText } from '../parser/parse.ts';
import { compute } from './stats.ts';
import type { ParseOptions } from '../parser/types.ts';
import type { ProgressEvent } from '../parser/parse.ts';
import type { ChatStats } from './stats.ts';

// ─── Message types ────────────────────────────────────────────────────────────

export interface WorkerRequest {
  type: 'analyze';
  payload: {
    text: string;
    options?: ParseOptions;
  };
}

export type WorkerResponse =
  | { type: 'progress'; payload: ProgressEvent }
  | { type: 'result'; payload: SerializedStats }
  | { type: 'error'; payload: { code: string; message: string } };

/**
 * ChatStats with Maps serialized to arrays so they can be sent
 * via postMessage (Maps are not cloneable across the worker boundary).
 */
export interface SerializedStats {
  totalMessages: number;
  totalWords: number;
  totalChars: number;
  activeDays: number;
  avgMessagesPerDay: number;
  firstMessageTs: number;
  lastMessageTs: number;
  participants: string[];

  perPerson: Array<[string, import('./stats.ts').PersonStats]>;

  hourlyActivity: number[];
  weekdayActivity: number[];
  monthOfYearActivity: number[];
  monthlyTimeline: Array<[string, number]>;
  calendarHeatmap: Array<[string, number]>;
  busiestDays: import('./stats.ts').DayEntry[];

  currentStreakDays: number;
  longestStreakDays: number;
  longestSilence: import('./stats.ts').Silence | null;
  topSilences: import('./stats.ts').Silence[];

  conversationStarters: Array<[string, number]>;
  conversationEnders: Array<[string, number]>;

  wordFrequency: Array<{ word: string; count: number }>;
  emojiByPerson: Array<[string, number]>;

  mediaCount: number;
  linkCount: number;
  deletedCount: number;
  questionCount: number;

  yearlyStats: import('./stats.ts').YearStats[];
}

// ─── Serialization ────────────────────────────────────────────────────────────

function serialize(stats: ChatStats): SerializedStats {
  return {
    totalMessages: stats.totalMessages,
    totalWords: stats.totalWords,
    totalChars: stats.totalChars,
    activeDays: stats.activeDays,
    avgMessagesPerDay: stats.avgMessagesPerDay,
    firstMessageTs: stats.firstMessageTs,
    lastMessageTs: stats.lastMessageTs,
    participants: stats.participants,
    perPerson: [...stats.perPerson.entries()],
    hourlyActivity: stats.hourlyActivity,
    weekdayActivity: stats.weekdayActivity,
    monthOfYearActivity: stats.monthOfYearActivity,
    monthlyTimeline: [...stats.monthlyTimeline.entries()],
    calendarHeatmap: [...stats.calendarHeatmap.entries()],
    busiestDays: stats.busiestDays,
    currentStreakDays: stats.currentStreakDays,
    longestStreakDays: stats.longestStreakDays,
    longestSilence: stats.longestSilence,
    topSilences: stats.topSilences,
    conversationStarters: [...stats.conversationStarters.entries()],
    conversationEnders: [...stats.conversationEnders.entries()],
    wordFrequency: stats.wordFrequency,
    emojiByPerson: [...stats.emojiByPerson.entries()],
    mediaCount: stats.mediaCount,
    linkCount: stats.linkCount,
    deletedCount: stats.deletedCount,
    questionCount: stats.questionCount,
    yearlyStats: stats.yearlyStats,
  };
}

// ─── Worker message handler ───────────────────────────────────────────────────

function post(msg: WorkerResponse): void {
  self.postMessage(msg);
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  if (type !== 'analyze') return;

  const { text, options } = payload;

  // Parse
  const outcome = parseText(text, options, (progress) => {
    post({ type: 'progress', payload: progress });
  });

  if (!outcome.ok) {
    post({ type: 'error', payload: outcome.error });
    return;
  }

  // Compute statistics
  try {
    const stats = compute(outcome.result);
    const serialized = serialize(stats);
    post({ type: 'result', payload: serialized });
  } catch (err) {
    post({
      type: 'error',
      payload: {
        code: 'compute_error',
        message:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while computing statistics.',
      },
    });
  }
});
