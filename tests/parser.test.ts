/**
 * tests/parser.test.ts
 *
 * Parser test suite using Vitest.
 * All tests use fake chat content — no real chat data.
 *
 * Coverage targets:
 * - iOS and Android format detection
 * - DMY, MDY, YMD date orders
 * - 12h and 24h clock formats
 * - Dot-separated dates (DD.MM.YYYY)
 * - Multiline messages
 * - System messages
 * - Media placeholders
 * - Deleted message notices
 * - Empty file
 * - File over size limit
 * - No messages found
 * - Arabic and Urdu text
 * - Group vs direct chat detection
 * - Participant extraction
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseText } from '../src/parser/index.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSample(filename: string): string {
  return readFileSync(join('samples', filename), 'utf-8');
}

// ─── iOS group chat (English) ─────────────────────────────────────────────────

describe('iOS format — English group chat', () => {
  const text = loadSample('fake_group_ios.txt');

  it('parses successfully', () => {
    const result = parseText(text);
    expect(result.ok).toBe(true);
  });

  it('detects iOS platform', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.platform).toBe('ios');
  });

  it('detects DMY date order', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.dateOrder).toBe('dmy');
  });

  it('detects 24h clock', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.clockFormat).toBe('24h');
  });

  it('detects group chat type', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.chatType).toBe('group');
  });

  it('extracts all three participants', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.participants).toContain('Hassan');
    expect(result.result.meta.participants).toContain('Ahmad');
    expect(result.result.meta.participants).toContain('Sara');
  });

  it('parses at least 30 messages', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.messages.length).toBeGreaterThanOrEqual(30);
  });

  it('detects the media placeholder message', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const mediaMessages = result.result.messages.filter((m) => m.isMedia);
    expect(mediaMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('detects the deleted message', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const deletedMessages = result.result.messages.filter((m) => m.isDeleted);
    expect(deletedMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('produces timestamps in ascending order', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const ts = result.result.messages.map((m) => m.timestamp);
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i]!).toBeGreaterThanOrEqual(ts[i - 1]!);
    }
  });

  it('first message timestamp is in year 2024', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const year = new Date(result.result.messages[0]!.timestamp).getUTCFullYear();
    expect(year).toBe(2024);
  });
});

// ─── Android 12h direct chat (English) ───────────────────────────────────────

describe('Android 12h format — English direct chat', () => {
  const text = loadSample('fake_direct_android_12h.txt');

  it('parses successfully', () => {
    const result = parseText(text);
    expect(result.ok).toBe(true);
  });

  it('detects Android platform', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.platform).toBe('android');
  });

  it('detects 12h clock', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.clockFormat).toBe('12h');
  });

  it('detects direct chat type', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.chatType).toBe('direct');
  });

  it('extracts both participants', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.participants).toContain('Tariq Mirza');
    expect(result.result.meta.participants).toContain('Yasmin Nour');
  });

  it('handles multiline message correctly', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    // The multiline message body spans a continuation line
    const multiline = result.result.messages.find(
      (m) => m.body.includes('accumulates continuation lines'),
    );
    expect(multiline).toBeDefined();
  });

  it('detects missed call system message', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const systemMessages = result.result.messages.filter((m) => m.isSystem);
    expect(systemMessages.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── iOS group chat (Arabic) ──────────────────────────────────────────────────

describe('iOS format — Arabic group chat', () => {
  const text = loadSample('fake_group_arabic_ios.txt');

  it('parses successfully', () => {
    const result = parseText(text);
    expect(result.ok).toBe(true);
  });

  it('detects group chat type', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.chatType).toBe('group');
  });

  it('extracts Arabic participant names', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.participants).toContain('ليلى حسن');
    expect(result.result.meta.participants).toContain('أحمد خان');
  });

  it('detects Arabic media placeholder', () => {
    // The Arabic sample also uses English "<Media omitted>" — both should work
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    const mediaMessages = result.result.messages.filter((m) => m.isMedia);
    expect(mediaMessages.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── iOS group chat (Urdu, dot-separated dates) ───────────────────────────────

describe('iOS format — Urdu group chat with dot-separated dates', () => {
  const text = loadSample('fake_group_urdu_ios.txt');

  it('parses successfully', () => {
    const result = parseText(text);
    expect(result.ok).toBe(true);
  });

  it('detects group chat type', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.chatType).toBe('group');
  });

  it('extracts Urdu participant names', () => {
    const result = parseText(text);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.meta.participants).toContain('لیلیٰ حسن');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('returns a typed error for an empty string', () => {
    const result = parseText('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('empty_file');
    }
  });

  it('returns a typed error for a file with no recognizable messages', () => {
    const result = parseText('This is just some text.\nNo timestamps here.\nNothing at all.');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('no_messages_found');
    }
  });

  it('returns a typed error for a file over 50 MB', () => {
    // Create a fake text string over 50 MB in character count
    const bigText = 'x'.repeat(50 * 1024 * 1024 + 1);
    const result = parseText(bigText);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('file_too_large');
    }
  });

  it('accepts a DMY override when auto-detection would pick wrong order', () => {
    // A chat where all dates are ambiguous (01/01/2024) — override should be respected
    const ambiguous = [
      '[01/01/2024, 10:00:00] Alice: Hello',
      '[01/02/2024, 10:00:00] Bob: Hi',
    ].join('\n');
    const result = parseText(ambiguous, { dateOrder: 'mdy' });
    if (!result.ok) throw new Error(result.error.message);
    // With MDY override, 01/01/2024 = Jan 1 and 01/02/2024 = Jan 2
    expect(result.result.meta.dateOrder).toBe('mdy');
  });

  it('handles a single-message chat', () => {
    const single = '[15/03/2024, 14:30:00] Solo User: This is the only message.';
    const result = parseText(single);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.messages.length).toBe(1);
    expect(result.result.messages[0]!.sender).toBe('Solo User');
    expect(result.result.messages[0]!.body).toBe('This is the only message.');
  });

  it('handles a message with an emoji in the sender name', () => {
    const chat = '[15/03/2024, 14:30:00] 🎉 Party Person: Hello everyone.';
    const result = parseText(chat);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.messages[0]!.sender).toBe('🎉 Party Person');
  });

  it('reports progress events during parsing', () => {
    const text = loadSample('fake_group_ios.txt');
    const events: string[] = [];
    parseText(text, undefined, (e) => events.push(e.stage));
    expect(events).toContain('detecting');
    expect(events).toContain('parsing');
    expect(events).toContain('done');
  });

  it('records unparsed lines without crashing', () => {
    // Mix valid messages with a junk line
    const mixed = [
      '[01/01/2024, 09:00:00] Alice: First message',
      'This line has no timestamp and appears mid-file',
      '[01/01/2024, 09:01:00] Alice: Second message',
    ].join('\n');
    const result = parseText(mixed);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.result.messages.length).toBe(2);
  });
});
