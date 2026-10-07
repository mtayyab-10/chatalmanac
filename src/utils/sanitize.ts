/**
 * src/utils/sanitize.ts
 *
 * Centralized HTML escaping and CSV sanitization utilities.
 * Pure functions with zero external dependencies.
 */

/**
 * Escapes characters that have special meaning in HTML (&, <, >, ", ').
 * Protects against XSS when injecting dynamic content into HTML templates.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a cell value for CSV export to defend against CSV Formula Injection (CWE-1236).
 * If a cell begins with dangerous formula trigger characters (=, +, -, @, tab, CR),
 * prefixes it with a single quote (') so spreadsheets treat it as inert text.
 */
export function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const firstChar = str.charAt(0);
  const dangerousTriggers = ['=', '+', '-', '@', '\t', '\r'];
  const safeStr = dangerousTriggers.includes(firstChar) ? `'${str}` : str;
  return `"${safeStr.replace(/"/g, '""')}"`;
}
