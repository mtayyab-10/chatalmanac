/**
 * src/storage/db.ts
 *
 * IndexedDB setup for Chatalmanac using the `idb` wrapper library.
 *
 * Privacy notes:
 * - Only statistics (numbers and counts) are stored, never raw message text.
 * - The filename is stored for display only, not as a path.
 * - All data stays on the user's device. Clearing browser data removes it.
 * - The user explicitly triggers saving — nothing is auto-saved.
 *
 * Schema version history:
 *   v1: initial schema — 'results' object store with 'id' keyPath
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { SerializedStats } from '../worker/analyzer.worker.ts';

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface SavedResult {
  /** UUID v4, generated client-side */
  id: string;
  /** Unix timestamp (ms) when the user clicked Save */
  savedAt: number;
  /** Filename as shown to the user — for display only */
  filename: string;
  /** Participants list for the list view title */
  participants: string[];
  /** First message timestamp in the chat */
  firstMessageTs: number;
  /** Last message timestamp in the chat */
  lastMessageTs: number;
  /** Total message count — shown in the list view */
  totalMessages: number;
  /** The full computed statistics — no raw message text */
  stats: SerializedStats;
}

interface ChatalmanacDB extends DBSchema {
  results: {
    key: string;
    value: SavedResult;
    indexes: { 'by-savedAt': number };
  };
}

// ─── Database singleton ───────────────────────────────────────────────────────

let _db: IDBPDatabase<ChatalmanacDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<ChatalmanacDB>> {
  if (_db) return _db;

  _db = await openDB<ChatalmanacDB>('chatalmanac', 1, {
    upgrade(db) {
      const store = db.createObjectStore('results', { keyPath: 'id' });
      store.createIndex('by-savedAt', 'savedAt');
    },
  });

  return _db;
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

/** Save a new result. Returns the generated id. */
export async function saveResult(
  stats: SerializedStats,
  filename: string,
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const record: SavedResult = {
    id,
    savedAt: Date.now(),
    filename,
    participants: stats.participants,
    firstMessageTs: stats.firstMessageTs,
    lastMessageTs: stats.lastMessageTs,
    totalMessages: stats.totalMessages,
    stats,
  };
  await db.put('results', record);
  return id;
}

/** Load all saved results, newest first. */
export async function loadAllResults(): Promise<SavedResult[]> {
  const db = await getDb();
  const all = await db.getAll('results');
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

/** Load a single saved result by id. */
export async function loadResult(id: string): Promise<SavedResult | undefined> {
  const db = await getDb();
  return db.get('results', id);
}

/** Delete a saved result by id. */
export async function deleteResult(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('results', id);
}

/** Clear all saved results. */
export async function clearAllResults(): Promise<void> {
  const db = await getDb();
  await db.clear('results');
}

/** Count saved results (for nav badge). */
export async function countResults(): Promise<number> {
  const db = await getDb();
  return db.count('results');
}
