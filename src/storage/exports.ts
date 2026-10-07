/**
 * src/storage/exports.ts
 *
 * Export utilities: JSON, CSV, and PNG share card.
 * All exports are generated and downloaded entirely in the browser.
 * Nothing is sent to any server.
 */

import type { SerializedStats } from '../worker/analyzer.worker.ts';
import { sanitizeCsvCell } from '../utils/sanitize.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(participants: string[]): string {
  return participants
    .slice(0, 2)
    .join('_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 40) || 'chat';
}

// ─── JSON export ──────────────────────────────────────────────────────────────

export function createJSONBackupPayload(stats: SerializedStats): {
  _format: string;
  exportedAt: string;
  stats: SerializedStats;
} {
  return {
    _format: 'chatalmanac-export-v1',
    exportedAt: new Date().toISOString(),
    stats,
  };
}

/**
 * Downloads the full stats object as a JSON file.
 * This is a lossless export — re-importing it could restore the full results view.
 */
export function exportJSON(stats: SerializedStats): void {
  const payload = createJSONBackupPayload(stats);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, `${safeFilename(stats.participants)}_chatalmanac.json`);
}

/**
 * Validates and parses a previously exported JSON backup file.
 * Throws an Error with a plain-language explanation if the file is invalid.
 */
export function parseJSONBackup(jsonString: string): { stats: SerializedStats; exportedAt?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('The backup file is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid backup format: expected an object.');
  }

  const obj = parsed as Record<string, unknown>;
  const stats = (obj['stats'] ?? obj) as SerializedStats;

  if (
    !stats ||
    typeof stats !== 'object' ||
    typeof stats.totalMessages !== 'number' ||
    !Array.isArray(stats.participants) ||
    !Array.isArray(stats.perPerson)
  ) {
    throw new Error('Invalid backup file: missing required chat statistics data.');
  }

  const result: { stats: SerializedStats; exportedAt?: string } = { stats };
  if (typeof obj['exportedAt'] === 'string') {
    result.exportedAt = obj['exportedAt'];
  }
  return result;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

/**
 * Generates comma-separated values (CSV) string for per-person stats.
 * Includes UTF-8 BOM prefix and summary row.
 */
export function generateCSVContent(stats: SerializedStats): string {
  const BOM = '\uFEFF';

  const headers = [
    'Participant',
    'Messages',
    'Share (%)',
    'Words',
    'Avg message length (chars)',
    'Media files',
    'Links',
    'Emoji count',
    'Questions asked',
    'Median response time (min)',
  ];

  const rows = stats.perPerson.map(([, p]) => {
    const medianMins = p.medianResponseMs !== null
      ? (p.medianResponseMs / 60_000).toFixed(1)
      : '';
    return [
      p.name,
      p.messageCount,
      p.sharePercent.toFixed(1),
      p.wordCount,
      p.avgMessageLength.toFixed(0),
      p.mediaCount,
      p.linkCount,
      p.emojiCount,
      p.questionCount,
      medianMins,
    ].map(sanitizeCsvCell).join(',');
  });

  // Summary row
  rows.push('');
  rows.push([
    '"Total"',
    `"${stats.totalMessages}"`,
    '"100"',
    `"${stats.totalWords}"`,
    `"${stats.totalMessages > 0 ? (stats.totalChars / stats.totalMessages).toFixed(0) : '0'}"`,
    `"${stats.mediaCount}"`,
    `"${stats.linkCount}"`,
    '',
    '',
    '',
  ].join(','));

  return BOM + headers.map((h) => `"${h}"`).join(',') + '\n' + rows.join('\n');
}

/**
 * Downloads per-person statistics as a CSV file.
 * Comma-separated, UTF-8 BOM prefix so Excel opens it correctly.
 */
export function exportCSV(stats: SerializedStats): void {
  const csv = generateCSVContent(stats);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${safeFilename(stats.participants)}_chatalmanac.csv`);
}

// ─── Share card (PNG) ─────────────────────────────────────────────────────────

const CARD_W = 900;
const CARD_H = 500;

/**
 * Draws a shareable stats card on a <canvas> and triggers a PNG download.
 * Uses only the Canvas 2D API — no external image library needed.
 */
export async function exportShareCard(stats: SerializedStats): Promise<void> {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-fatal font load fallback
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ── Background ────────────────────────────────────────────────────────────
  // Organic deep inky warm forest gradient
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, '#14130F');
  bg.addColorStop(0.5, '#1A1914');
  bg.addColorStop(1, '#14130F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle ambient forest glow top-right
  const orb = ctx.createRadialGradient(CARD_W * 0.8, CARD_H * 0.2, 0, CARD_W * 0.8, CARD_H * 0.2, 220);
  orb.addColorStop(0, 'rgba(95, 181, 143, 0.12)');
  orb.addColorStop(1, 'rgba(95, 181, 143, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Border
  ctx.strokeStyle = '#2C2A22';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 12, 12, CARD_W - 24, CARD_H - 24, 16);
  ctx.stroke();

  // ── Brand ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#EDE8DC';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('chat', 48, 56);
  ctx.fillStyle = '#5FB58F';
  ctx.fillText('almanac', 48 + ctx.measureText('chat').width, 56);

  // Privacy badge
  ctx.fillStyle = 'rgba(95, 181, 143, 0.12)';
  roundRect(ctx, CARD_W - 200, 36, 152, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#5FB58F';
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.fillText('processed locally · private', CARD_W - 188, 53);

  // ── Date range ────────────────────────────────────────────────────────────
  const dateRange = `${fmt(stats.firstMessageTs)} – ${fmt(stats.lastMessageTs)}`;
  ctx.fillStyle = '#A9A294';
  ctx.font = '400 14px Inter, system-ui, sans-serif';
  ctx.fillText(dateRange, 48, 90);

  // Participants
  ctx.fillStyle = '#EDE8DC';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  const participantText = stats.participants.slice(0, 3).join(' · ');
  ctx.fillText(participantText, 48, 130);

  // ── Stat blocks ───────────────────────────────────────────────────────────
  const bigStats = [
    { label: 'Messages', value: fmt_num(stats.totalMessages) },
    { label: 'Active days', value: String(stats.activeDays) },
    { label: 'Longest streak', value: `${stats.longestStreakDays}d` },
    { label: 'Words sent', value: fmt_num(stats.totalWords) },
  ];

  const colW = (CARD_W - 96) / bigStats.length;
  bigStats.forEach(({ label, value }, i) => {
    const x = 48 + i * colW;
    const y = 195;

    // Card background
    ctx.fillStyle = '#1E1C16';
    roundRect(ctx, x, y, colW - 16, 110, 12);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#2C2A22';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, colW - 16, 110, 12);
    ctx.stroke();

    // Value
    ctx.fillStyle = '#5FB58F';
    ctx.font = '700 32px Inter, system-ui, sans-serif';
    ctx.fillText(value, x + 16, y + 50);

    // Label
    ctx.fillStyle = '#A9A294';
    ctx.font = '400 13px Inter, system-ui, sans-serif';
    ctx.fillText(label, x + 16, y + 76);
  });

  // ── Per-person message share ───────────────────────────────────────────────
  const sorted = [...stats.perPerson]
    .sort((a, b) => b[1].messageCount - a[1].messageCount)
    .slice(0, 4);
  const colors = ['#5FB58F', '#F0B158', '#E27E62', '#56A9B7'];

  let barY = 335;
  ctx.fillStyle = '#A9A294';
  ctx.font = '500 12px Inter, system-ui, sans-serif';
  ctx.fillText('Message share', 48, barY - 12);

  sorted.forEach(([, p], i) => {
    const pct = stats.totalMessages > 0 ? p.messageCount / stats.totalMessages : 0;
    const barW = (CARD_W - 220) * pct;

    // Background track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, 48, barY, CARD_W - 220, 20, 4);
    ctx.fill();

    // Fill
    ctx.fillStyle = colors[i] ?? '#A9A294';
    roundRect(ctx, 48, barY, Math.max(barW, 4), 20, 4);
    ctx.fill();

    // Name + pct
    ctx.fillStyle = '#EDE8DC';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    ctx.fillText(p.name, CARD_W - 160, barY + 14);
    ctx.fillStyle = '#A9A294';
    ctx.fillText(`${(pct * 100).toFixed(0)}%`, CARD_W - 55, barY + 14);

    barY += 30;
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#7D776A';
  ctx.font = '400 12px Inter, system-ui, sans-serif';
  ctx.fillText('chatalmanac.app · your data never left your device', 48, CARD_H - 28);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    triggerDownload(blob, `${safeFilename(stats.participants)}_card.png`);
  }, 'image/png');
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString('en', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function fmt_num(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
