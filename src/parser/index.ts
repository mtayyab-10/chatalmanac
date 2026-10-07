/**
 * src/parser/index.ts
 *
 * Public API for the Chatalmanac parser.
 * Import from here, not from individual files.
 */

export { parseText, parseLines, MAX_FILE_CHARS } from './parse.ts';
export type { ProgressEvent, ProgressStage } from './parse.ts';
export { detectFormat, isMessageStart, isGroupStructureEvent } from './detector.ts';
export type { DetectionResult } from './detector.ts';
export type {
  ParsedMessage,
  ParseResult,
  ParseOutcome,
  ExportMeta,
  ParseOptions,
  ParseError,
} from './types.ts';
