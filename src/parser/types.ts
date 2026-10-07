/**
 * src/parser/types.ts
 *
 * Shared types for the Chatalmanac parser.
 * No runtime dependencies — pure type definitions.
 */

/** A single parsed message from a chat export. */
export interface ParsedMessage {
  /** Unix timestamp in milliseconds. */
  timestamp: number;
  /** Display name of the sender, exactly as exported. */
  sender: string;
  /** The full text of the message body. */
  body: string;
  /** True if this is a WhatsApp system message (joined, left, changed subject, etc.). */
  isSystem: boolean;
  /** True if the message body is a media placeholder ("<Media omitted>" or equivalent). */
  isMedia: boolean;
  /** True if the message body is a deleted-message notice. */
  isDeleted: boolean;
}

/** The result of a successful parse. */
export interface ParseResult {
  /** All parsed messages, in chronological order. */
  messages: ParsedMessage[];
  /** Detected metadata about the export file. */
  meta: ExportMeta;
  /** Any lines that could not be parsed, with their line numbers (1-indexed). */
  unparsedLines: Array<{ lineNumber: number; content: string }>;
}

/** Metadata detected during parsing. */
export interface ExportMeta {
  /** The regex pattern used to detect timestamps. */
  datePattern: string;
  /** Whether the export used 12-hour or 24-hour time. */
  clockFormat: '12h' | '24h';
  /** Whether dates appear as DD/MM/YYYY, MM/DD/YYYY, or YYYY/MM/DD. */
  dateOrder: 'dmy' | 'mdy' | 'ymd';
  /** Operating system that produced the export. */
  platform: 'ios' | 'android' | 'unknown';
  /** Whether the chat is a group or a one-to-one conversation. */
  chatType: 'group' | 'direct' | 'unknown';
  /** All unique participant names. */
  participants: string[];
  /** Total number of lines in the source file. */
  totalLines: number;
}

/** Options that can be passed to override auto-detection. */
export interface ParseOptions {
  /** Override the date order if auto-detection fails. */
  dateOrder?: 'dmy' | 'mdy' | 'ymd';
  /** Override the clock format if auto-detection fails. */
  clockFormat?: '12h' | '24h';
}

/** A parse error with a plain-language message. */
export interface ParseError {
  code:
    | 'empty_file'
    | 'no_messages_found'
    | 'unsupported_format'
    | 'file_too_large'
    | 'zip_read_error';
  message: string;
}

/** The union type returned by the parser — either success or a typed error. */
export type ParseOutcome =
  | { ok: true; result: ParseResult }
  | { ok: false; error: ParseError };
