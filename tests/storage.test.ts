import { describe, it, expect } from 'vitest';
import {
  createJSONBackupPayload,
  parseJSONBackup,
  generateCSVContent,
  safeFilename,
} from '../src/storage/exports.ts';
import type { SerializedStats } from '../src/worker/analyzer.worker.ts';

function createDummyStats(): SerializedStats {
  return {
    totalMessages: 120,
    totalWords: 1500,
    totalChars: 7500,
    activeDays: 14,
    avgMessagesPerDay: 8.57,
    firstMessageTs: 1704067200000, // 2024-01-01
    lastMessageTs: 1705276800000,  // 2024-01-15
    participants: ['Alice', 'Bob "The Builder"'],
    perPerson: [
      [
        'Alice',
        {
          name: 'Alice',
          messageCount: 80,
          wordCount: 1000,
          charCount: 5000,
          sharePercent: 66.6666,
          mediaCount: 6,
          linkCount: 3,
          emojiCount: 15,
          deletedCount: 1,
          questionCount: 8,
          avgMessageLength: 62.5,
          medianResponseMs: 120_000, // 2 mins
          avgResponseMs: 130_000,
          responseDistribution: [10, 5, 2, 1, 0, 0],
          topEmoji: [{ emoji: '😊', count: 8 }],
        },
      ],
      [
        'Bob "The Builder"',
        {
          name: 'Bob "The Builder"',
          messageCount: 40,
          wordCount: 500,
          charCount: 2500,
          sharePercent: 33.3333,
          mediaCount: 4,
          linkCount: 1,
          emojiCount: 5,
          deletedCount: 0,
          questionCount: 4,
          avgMessageLength: 62.5,
          medianResponseMs: 240_000, // 4 mins
          avgResponseMs: 250_000,
          responseDistribution: [5, 4, 3, 0, 0, 0],
          topEmoji: [{ emoji: '👍', count: 4 }],
        },
      ],
    ],
    hourlyActivity: new Array(24).fill(5),
    weekdayActivity: new Array(7).fill(17),
    monthOfYearActivity: new Array(12).fill(10),
    monthlyTimeline: [['2024-01', 120]],
    calendarHeatmap: [['2024-01-01', 10]],
    busiestDays: [{ date: '2024-01-01', count: 10 }],
    currentStreakDays: 3,
    longestStreakDays: 5,
    longestSilence: null,
    topSilences: [],
    conversationStarters: [['Alice', 5]],
    conversationEnders: [['Bob "The Builder"', 4]],
    wordFrequency: [{ word: 'hello', count: 12 }],
    emojiByPerson: [['Alice', 15], ['Bob "The Builder"', 5]],
    mediaCount: 10,
    linkCount: 4,
    deletedCount: 1,
    questionCount: 12,
    yearlyStats: [],
  };
}

describe('Exports and Backups (Phase 5)', () => {
  it('generates a valid JSON backup payload', () => {
    const stats = createDummyStats();
    const payload = createJSONBackupPayload(stats);

    expect(payload._format).toBe('chatalmanac-export-v1');
    expect(typeof payload.exportedAt).toBe('string');
    expect(payload.stats.totalMessages).toBe(120);
    expect(payload.stats.participants).toEqual(['Alice', 'Bob "The Builder"']);
  });

  it('correctly parses and validates a valid JSON backup', () => {
    const stats = createDummyStats();
    const payload = createJSONBackupPayload(stats);
    const jsonStr = JSON.stringify(payload);

    const parsed = parseJSONBackup(jsonStr);
    expect(parsed.stats.totalMessages).toBe(120);
    expect(parsed.stats.participants).toEqual(['Alice', 'Bob "The Builder"']);
    expect(parsed.exportedAt).toBe(payload.exportedAt);
  });

  it('rejects malformed or invalid JSON backup files', () => {
    expect(() => parseJSONBackup('{ invalid json')).toThrow(
      'The backup file is not valid JSON.',
    );

    expect(() => parseJSONBackup('null')).toThrow(
      'Invalid backup format: expected an object.',
    );

    expect(() => parseJSONBackup(JSON.stringify({ notStats: 123 }))).toThrow(
      'Invalid backup file: missing required chat statistics data.',
    );

    expect(() =>
      parseJSONBackup(JSON.stringify({ stats: { totalMessages: 'not a number' } })),
    ).toThrow('Invalid backup file: missing required chat statistics data.');
  });

  it('generates valid CSV with Excel BOM, headers, escaped names, and summary row', () => {
    const stats = createDummyStats();
    const csv = generateCSVContent(stats);

    // Starts with UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Headers
    expect(csv).toContain('"Participant","Messages","Share (%)"');

    // Escaped double quotes in names
    expect(csv).toContain('"Bob ""The Builder"""');

    // Values formatted properly
    expect(csv).toContain('"80","66.7"');
    expect(csv).toContain('"2.0"'); // 120_000 ms = 2.0 mins

    // Summary row
    expect(csv).toContain('"Total","120","100","1500"');
  });

  it('sanitizes filename properly including unicode names', () => {
    expect(safeFilename(['Alice', 'Bob'])).toBe('Alice_Bob');
    expect(safeFilename(['Alice/Bob:Family', 'Charlie*'])).toBe('AliceBobFamily_Charlie');
    expect(safeFilename(['محمد', 'علي'])).toBe('محمد_علي');
    expect(safeFilename([])).toBe('chat');
  });

  it('neutralizes CSV formula injection in participant names', () => {
    const stats = createDummyStats();
    stats.perPerson[0]![1].name = '=cmd|\' /C calc\'!A0';
    const csv = generateCSVContent(stats);
    expect(csv).toContain('"\'=cmd|\' /C calc\'!A0"');
  });
});
