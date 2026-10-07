import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeCsvCell } from '../src/utils/sanitize.ts';

describe('Sanitization utilities', () => {
  it('escapes &, <, >, ", and single quote correctly', () => {
    expect(escapeHtml('<script>alert("xss & \'hack\'")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss &amp; &#39;hack&#39;&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml('')).toBe('');
  });

  it('neutralizes CSV formula triggers (=, +, -, @, tab, newline)', () => {
    expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(sanitizeCsvCell('+cmd|')).toBe(`"'+cmd|"`);
    expect(sanitizeCsvCell('-5')).toBe(`"'-5"`);
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
    expect(sanitizeCsvCell('\tmalicious')).toBe(`"'\tmalicious"`);
    expect(sanitizeCsvCell('Normal Text')).toBe(`"Normal Text"`);
    expect(sanitizeCsvCell(1234)).toBe(`"1234"`);
  });
});
