/**
 * scripts/audit.mjs
 *
 * Privacy audit script — runs after `npm run build`.
 * Scans every file in dist/ and reports any suspicious content:
 *
 * 1. External fetch/XHR/beacon calls (runtime network requests)
 * 2. Tracking keywords (analytics, beacon, pixel, etc.)
 * 3. References to known tracking domains
 *
 * Run: node scripts/audit.mjs
 * Or:  npm run audit:privacy
 *
 * Exit code 0 = clean. Exit code 1 = issues found.
 *
 * Design note: we deliberately do NOT flag plain external URLs that appear in:
 *   - License comment headers (expected in minified bundles)
 *   - Hyperlinks in static HTML (the href is not a fetch call)
 *   - Self-origin asset URLs like /assets/...
 * We DO flag patterns that indicate a runtime outbound network call.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const DIST_DIR = './dist';

// ─── Patterns that indicate a live outbound network request ──────────────────

/**
 * These patterns match JavaScript expressions that make network calls.
 * A URL in a comment or href is not a network call — an XHR, fetch, or
 * sendBeacon with an external URL is.
 */
const RUNTIME_NETWORK_PATTERNS = [
  // fetch() or XMLHttpRequest with an external URL
  /fetch\([`"']https?:\/\/(?!localhost|127\.0\.0\.1)/,
  /new XMLHttpRequest.*open.*https?:\/\/(?!localhost|127\.0\.0\.1)/,
  // Beacon API
  /navigator\.sendBeacon\([`"']https?:\/\/(?!localhost|127\.0\.0\.1)/,
  // Image pixel tracking pattern
  /new Image.*\.src\s*=\s*[`"']https?:\/\/(?!localhost|127\.0\.0\.1)/,
  // Script injection
  /document\.createElement\([`"']script[`"']\).*src\s*=\s*[`"']https?:\/\/(?!localhost|127\.0\.0\.1)/,
  // WebSocket to external
  /new WebSocket\([`"']wss?:\/\/(?!localhost|127\.0\.0\.1)/,
];

/** Tracking and analytics keywords — must appear as function calls/property access. */
const TRACKING_CODE_PATTERNS = [
  /\bgtag\s*\(/,
  /\bga\s*\(\s*['"]send['"]/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /analytics\.js/,
  /segment\.io/,
  /\bmixpanel\b/,
  /\bhotjar\b/,
  /\.intercom\.io/,
  /\.fullstory\.com/,
  /\.heap\.io/,
  /\.amplitude\.com/,
  /\.bugsnag\.com/,
  /\.logrocket\.io/,
  /\bclarity\.ms\b/,
  /doubleclick\.net/,
  /facebook\.net\/en_US\/fbevents/,
  /connect\.facebook\.net/,
];

const FILE_EXTENSIONS_TO_SCAN = new Set(['.js', '.mjs', '.html', '.css', '.json']);

// ─── Scanner ──────────────────────────────────────────────────────────────────

let totalIssues = 0;
let totalFilesScanned = 0;

function log(level, ...args) {
  const prefix = level === 'ok'
    ? '\x1b[32m✓\x1b[0m'
    : level === 'warn'
    ? '\x1b[33m⚠\x1b[0m'
    : '\x1b[31m✗\x1b[0m';
  console.log(prefix, ...args);
}

function scanFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!FILE_EXTENSIONS_TO_SCAN.has(ext)) return;

  const content = readFileSync(filePath, 'utf-8');
  const rel = relative(DIST_DIR, filePath);
  const lines = content.split('\n');
  let fileIssues = 0;

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // Check runtime network call patterns
    for (const pattern of RUNTIME_NETWORK_PATTERNS) {
      if (pattern.test(line)) {
        log('error', `${rel}:${lineNum} — runtime network call detected:`);
        log('error', `  ${line.trim().slice(0, 140)}`);
        fileIssues++;
        totalIssues++;
      }
    }

    // Check tracking code patterns
    for (const pattern of TRACKING_CODE_PATTERNS) {
      if (pattern.test(line)) {
        log('error', `${rel}:${lineNum} — tracking code pattern "${pattern.source}":`);
        log('error', `  ${line.trim().slice(0, 140)}`);
        fileIssues++;
        totalIssues++;
      }
    }
  });

  if (fileIssues === 0) {
    log('ok', rel);
  }

  totalFilesScanned++;
}

function scanDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      scanDir(full);
    } else {
      scanFile(full);
    }
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log('\n\x1b[1mChatalmanac Privacy Audit\x1b[0m');
console.log('Scanning:', DIST_DIR);
console.log('─'.repeat(60));

try {
  scanDir(DIST_DIR);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('\nError: dist/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }
  throw err;
}

console.log('─'.repeat(60));
console.log(`Scanned ${totalFilesScanned} files.`);

if (totalIssues === 0) {
  console.log('\x1b[32m\nAll clean — no outbound network calls, tracking code, or known analytics domains found.\x1b[0m\n');
  process.exit(0);
} else {
  console.log(`\x1b[31m\n${totalIssues} issue(s) found. Please review the items above.\x1b[0m\n`);
  process.exit(1);
}
