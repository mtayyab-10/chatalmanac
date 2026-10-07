/**
 * src/parser/parse.ts
 *
 * Main parser. Accepts an array of text lines and returns a ParseOutcome.
 *
 * Design notes:
 * - Chunked processing: yields progress events so the caller (a Web Worker)
 *   can post progress messages without blocking the thread.
 * - Never stores raw message bodies beyond the scope of this function.
 * - The parser is pluggable: the DetectionResult is passed in separately
 *   so future platform parsers (Telegram, Signal) can share this loop.
 */

import type {
  ParsedMessage,
  ParseOutcome,
  ExportMeta,
  ParseOptions,
} from './types.ts';
import {
  detectFormat,
  isMessageStart,
  isSystemMessage,
  isGroupStructureEvent,
  isMediaPlaceholder,
  isDeletedMessage,
  detectChatType,
} from './detector.ts';
import { parseTimestamp } from './timestamp.ts';

// ─── Progress reporting ───────────────────────────────────────────────────────

export type ProgressStage =
  | 'reading'
  | 'detecting'
  | 'parsing'
  | 'computing'
  | 'done';

export interface ProgressEvent {
  stage: ProgressStage;
  /** 0–100 */
  percent: number;
  linesProcessed?: number;
  totalLines?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum file size we accept (50 MB, expressed in characters). */
export const MAX_FILE_CHARS = 50 * 1024 * 1024;

/** How many lines to process per chunk before yielding a progress event. */
const CHUNK_SIZE = 5_000;

// ─── Line splitter ────────────────────────────────────────────────────────────

/** Split text on any newline style (CRLF, LF, CR). */
function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

// ─── Sender extraction ───────────────────────────────────────────────────────

/**
 * The remainder of a message-start line after the timestamp is:
 *   "Sender Name: body text..."
 *
 * System messages have no colon in this format (they are bare text).
 * We split on the first " : " or ": " to extract sender and body.
 */
function extractSenderAndBody(
  rest: string,
): { sender: string; body: string } | null {
  // WhatsApp uses " - " after the timestamp on Android; that's already stripped.
  // Now we have: "Sender Name: body" (or just "body" for system messages).
  const colonIdx = rest.indexOf(': ');
  if (colonIdx === -1) {
    // No colon — this is a system message body
    return { sender: '', body: rest.trim() };
  }
  const sender = rest.slice(0, colonIdx).trim();
  const body = rest.slice(colonIdx + 2).trim();
  return { sender, body };
}

// ─── Main parse function ──────────────────────────────────────────────────────

/**
 * Parse an array of text lines into a ParseResult.
 *
 * @param lines   All lines from the chat export file
 * @param options Optional overrides for date/time format detection
 * @param onProgress Callback for progress events (optional)
 */
export function parseLines(
  lines: string[],
  options?: ParseOptions,
  onProgress?: (event: ProgressEvent) => void,
): ParseOutcome {
  const totalLines = lines.length;

  if (totalLines === 0) {
    return {
      ok: false,
      error: {
        code: 'empty_file',
        message:
          'The file appears to be empty. Please check that you exported the full chat before opening it here.',
      },
    };
  }

  // Stage: detecting
  onProgress?.({ stage: 'detecting', percent: 5 });

  const format = detectFormat(lines, options);

  if (!format) {
    return {
      ok: false,
      error: {
        code: 'no_messages_found',
        message:
          'No messages were found in this file. This tool reads WhatsApp chat exports (.txt or .zip). ' +
          'If the file is from a different app, or if the format looks unusual, ' +
          'try selecting the date format manually below.',
      },
    };
  }

  // Stage: parsing
  onProgress?.({ stage: 'parsing', percent: 10, linesProcessed: 0, totalLines });

  const messages: ParsedMessage[] = [];
  const unparsedLines: Array<{ lineNumber: number; content: string }> = [];
  const participantSet = new Set<string>();
  let hasGroupSystemMessages = false;

  // Current message being assembled (multiline support)
  let currentTimestamp: number | null = null;
  let currentSender: string | null = null;
  let currentBodyParts: string[] = [];
  let currentIsSystem = false;

  function flushCurrent(): void {
    if (currentTimestamp === null) return;
    const body = currentBodyParts.join('\n');
    const isSystem = currentIsSystem || isSystemMessage(body);
    const isMedia = isMediaPlaceholder(body);
    const isDeleted = isDeletedMessage(body);

    const sender = currentSender ?? '';
    if (sender && !isSystem) {
      participantSet.add(sender);
    }
    if (isGroupStructureEvent(body)) {
      hasGroupSystemMessages = true;
    }

    messages.push({
      timestamp: currentTimestamp,
      sender,
      body,
      isSystem,
      isMedia,
      isDeleted,
    });

    currentTimestamp = null;
    currentSender = null;
    currentBodyParts = [];
    currentIsSystem = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Yield progress every CHUNK_SIZE lines
    if (i % CHUNK_SIZE === 0 && i > 0) {
      const percent = 10 + Math.floor((i / totalLines) * 80);
      onProgress?.({ stage: 'parsing', percent, linesProcessed: i, totalLines });
    }

    if (!isMessageStart(line)) {
      // Continuation line — append to current message body
      if (currentTimestamp !== null) {
        currentBodyParts.push(line);
      } else if (line.trim().length > 0) {
        // Non-empty line before any message — skip or record
        unparsedLines.push({ lineNumber: i + 1, content: line });
      }
      continue;
    }

    // This is a new message — flush the previous one
    flushCurrent();

    const parsed = parseTimestamp(line, format);
    if (!parsed) {
      unparsedLines.push({ lineNumber: i + 1, content: line });
      continue;
    }

    const { timestamp, rest } = parsed;
    const extracted = extractSenderAndBody(rest);
    if (!extracted) {
      unparsedLines.push({ lineNumber: i + 1, content: line });
      continue;
    }

    currentTimestamp = timestamp;
    currentSender = extracted.sender || null;
    currentBodyParts = [extracted.body];
    currentIsSystem = extracted.sender === '';
  }

  // Flush the last message
  flushCurrent();

  onProgress?.({ stage: 'computing', percent: 92 });

  if (messages.length === 0) {
    return {
      ok: false,
      error: {
        code: 'no_messages_found',
        message:
          'The file was read but no messages could be extracted. ' +
          'This can happen if the date format is unusual. ' +
          'Try selecting the date format manually below.',
      },
    };
  }

  const meta: ExportMeta = {
    datePattern: format.datePattern,
    clockFormat: format.clockFormat,
    dateOrder: format.dateOrder,
    platform: format.platform,
    chatType: detectChatType(participantSet, hasGroupSystemMessages),
    participants: Array.from(participantSet).sort(),
    totalLines,
  };

  onProgress?.({ stage: 'done', percent: 100 });

  return {
    ok: true,
    result: {
      messages,
      meta,
      unparsedLines,
    },
  };
}

// ─── Entry point for text files ───────────────────────────────────────────────

/**
 * Parse a complete chat export text string.
 * Validates file size first, then runs the line-based parser.
 */
export function parseText(
  text: string,
  options?: ParseOptions,
  onProgress?: (event: ProgressEvent) => void,
): ParseOutcome {
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: 'empty_file',
        message:
          'The file appears to be empty. Please check that you exported the full chat before opening it here.',
      },
    };
  }

  if (text.length > MAX_FILE_CHARS) {
    return {
      ok: false,
      error: {
        code: 'file_too_large',
        message:
          `This file is ${Math.round(text.length / 1024 / 1024)} MB. ` +
          `The current limit is 50 MB. Very large chats may run slowly on phones. ` +
          `Try exporting without media first — the text-only export is much smaller.`,
      },
    };
  }

  onProgress?.({ stage: 'reading', percent: 2 });
  const lines = splitLines(text);
  return parseLines(lines, options, onProgress);
}
