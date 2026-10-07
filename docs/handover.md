# Project handover guide

This guide provides an overview of Chatalmanac's architecture, operational guidance, and maintenance protocols for the project owner.

---

## 1. Project overview

Chatalmanac is a client-side web application designed to analyze exported WhatsApp chats with zero server reliance. It was engineered from the ground up to protect user privacy while delivering high-speed insights, interactive charts, head-to-head comparisons, and export options.

### Key architecture decisions

1. **Pure client-side execution**: All parsing, statistical analysis, and rendering occur entirely in the user's web browser. No backend server or cloud API is involved.
2. **Web Worker offloading**: Intensive text parsing and statistics computation run inside a separate background thread (`src/worker/analyzer.worker.ts`). This ensures the user interface remains completely smooth and responsive, even when analyzing large conversations.
3. **No UI framework dependencies**: Built with vanilla TypeScript and modular CSS rather than heavy frameworks (like React or Vue). This keeps the download size small, makes security audits straightforward, and eliminates dependency supply-chain risks.
4. **Offline support**: A custom Service Worker (`src/sw.ts`) caches the web application assets on first load, enabling complete offline functionality and intercepting any unexpected outbound network calls.
5. **Private storage**: Stored analyses are saved in the browser's local IndexedDB using the lightweight `idb` library. Only numerical counts and computed metrics are stored; raw message texts are never saved.

---

## 2. Directory structure

- `src/parser/` — Contains regular expression engines and detectors that parse WhatsApp text formats (iOS, Android, 12-hour/24-hour clocks, varied date formats, system messages, media notices, and multilingual patterns).
- `src/worker/` — Contains the statistics engine (`stats.ts`), stopword dictionaries (`stopwords.ts`), and the worker message protocol.
- `src/storage/` — Contains IndexedDB database operations (`db.ts`) and browser-based export handlers (`exports.ts`) for JSON backups, Excel-compatible CSVs, and Canvas 2D share cards.
- `src/ui/` — Houses modular view renderers (`landing.ts`, `loading.ts`, `results.ts`, `saved.ts`), components (`charts.ts`, `compare.ts`, `nav.ts`, `import-zone.ts`, `export-panel.ts`, `privacy-verify.ts`), and CSS styling.
- `src/locales/` — Translation dictionaries for English (`en.ts`), Urdu (`ur.ts`), Arabic (`ar.ts`), and French (`fr.ts`).
- `tests/` — Automated test suites running in Vitest covering the parser, storage/exports, and compare analytics.
- `scripts/` — Automated privacy audit script (`audit.mjs`) that inspects compiled production assets for network requests or analytics trackers.
- `docs/` — Public and internal documentation, including server headers (`server-headers.md`), license audits (`license-audit.md`), and the pre-release checklist (`release-checklist.md`).

---

## 3. Routine maintenance workflows

### Running tests

Run the automated test suite at any time:

```bash
npm test
```

### Running the privacy audit

Before publishing any update, run the privacy audit script against the built files:

```bash
npm run build
npm run audit:privacy
```

### Adding a new language

To add a new language (for example, Spanish `es`):
1. Create `src/locales/es.ts` by copying `src/locales/en.ts` and translating the string values.
2. Register the new locale in `src/locales/index.ts` under `SUPPORTED_LOCALES`.
3. Add the language name to the language selector in `src/ui/components/nav.ts`.

### Updating dependencies

All dependencies in `package.json` are pinned to exact versions. When updating packages:
1. Update one package at a time.
2. Verify that the updated package license remains compatible with the MIT license.
3. Re-run `npm test` and `npm run audit:privacy` to verify that no tracking scripts or breaking changes were introduced.

---

## 4. Hosting and deployment

Because the output of `npm run build` is a purely static bundle (`dist/`), it can be hosted anywhere:

### Netlify / Cloudflare Pages

Push the files to a repository connected to Netlify or Cloudflare Pages. The build command is `npm run build`, and the publish directory is `dist`. The `public/_headers` file will automatically configure all security headers.

### Self-hosted (Nginx / Apache)

If hosting on your own virtual server, follow the ready-to-paste server configuration blocks in [docs/internal/server-headers.md](file:///c:/Users/mtayy/OneDrive%20-%20FAST%20National%20University/Desktop/project-ultra/docs/internal/server-headers.md) to ensure proper Content Security Policy headers are active.

---

## 5. Support protocol

If users contact you for support regarding format issues or error messages:
- **Never ask or accept a user's exported chat file.**
- Direct users to test with the provided sample chat file to confirm their browser functions properly.
- If a user reports an unsupported date format, ask only for the timestamp format (for example, "DD/MM/YYYY, HH:MM") without any names or message content.
