# Release and privacy checklist

This document outlines the required checks before any public release or update of Chatalmanac.
Every item has an assigned role to ensure clear accountability.

---

## 1. Network privacy and data confinement

| Item | Requirement | Verification method | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| Zero outbound fetches | No network calls during parsing, analysis, or export | Run `npm run audit:privacy` against `./dist` | Lead developer | Verified clean | dark mode
| Offline capability | Site works completely offline once cached | Disconnect Wi-Fi and refresh page | QA tester | Verified |
| Service worker security | Service worker returns 403 for any non-origin request | Inspect `src/sw.ts` request interception | Privacy reviewer | Verified |
| Third-party scripts | No external analytics, tag managers, or fonts fetched from CDN | Inspect `dist/index.html` and bundled JS | Privacy reviewer | Verified clean |
| Local database privacy | Only computed counts and metrics stored in IndexedDB (no raw message text) | Inspect `src/storage/db.ts` record schema | Lead developer | Verified clean |

---

## 2. Server security and HTTP headers

| Item | Requirement | Verification method | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| Content security policy | `default-src 'none'`, `connect-src 'none'`, scripts/fonts self-hosted | Check `public/_headers` and `dist/_headers` | DevOps / Hosting | Verified |
| Frame protection | `X-Frame-Options: DENY` blocks clickjacking | Verify headers in production or preview | DevOps / Hosting | Verified |
| Referrer policy | `Referrer-Policy: no-referrer` prevents destination tracking | Verify headers in response | DevOps / Hosting | Verified |
| Device permissions | `Permissions-Policy` disables camera, mic, location, USB, payments | Verify permissions header string | DevOps / Hosting | Verified |
| Server access logs | Hosting provider configured not to log query parameters or URLs | Review Netlify/Cloudflare/Nginx settings | DevOps / Hosting | Verified |

---

## 3. Dependency and license governance

| Item | Requirement | Verification method | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| Pinned dependencies | Exact version numbers without `^` or `~` wildcards | Check `package.json` | Lead developer | Verified |
| License compatibility | All runtime packages licensed under MIT, ISC, or compatible terms | Run `npm run audit:license` / check `docs/internal/license-audit.md` | Legal / Reviewer | Verified |
| Security advisories | Zero high or critical vulnerabilities | Run `npm audit` | Lead developer | Verified |

---

## 4. Website copy and legal blame-protection

| Item | Requirement | Verification method | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| Truthful claims | No overpromising words like "military-grade", "unbreakable", or "impossible to access" | Content audit across all locales | Product manager | Verified |
| Non-affiliation | Prominent statement that Chatalmanac is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta | Check header, footer, and privacy page | Legal / Reviewer | Verified |
| Evidence disclaimer | Clear notice that results are not official court or visa evidence | Check results view and export summaries | Legal / Reviewer | Verified |
| Support protocol | Support team must never ask or accept user chat exports | Documented in support guidelines | Support lead | Verified |
| Privacy verification | Step-by-step interactive verification guide available to all users | Verify "Verify it yourself" widget on Privacy page | UX designer | Verified |

---

## 5. Software quality and accessibility

| Item | Requirement | Verification method | Owner | Status |
| :--- | :--- | :--- | :--- | :--- |
| Type safety | Zero TypeScript compile errors | Run `npm run build` | Lead developer | 0 errors |
| Test suite | All automated tests pass | Run `npm test` (all 42 tests passing) | QA tester | 42/42 passing |
| Accessibility | High-contrast focus rings, keyboard navigation, and reduced-motion support | Test with keyboard tab keys and screen reader | UX designer | Verified |
| Chart data tables | Accessible table alternative available on every chart | Test "Chart / Table" switch controls | UX designer | Verified |
| Multilingual support | Translations present and verified in English, Urdu, Arabic, and French | Review locale dictionary files | Translator | Verified |

---

## Pre-release sign-off protocol

Before making a release or publishing an update:
1. Run `npm test` — all test suites must pass.
2. Run `npm run build` — TypeScript check must pass with 0 errors.
3. Run `npm run audit:privacy` — all files in `dist/` must pass with zero issues.
4. Verify all checklist items above have an assigned reviewer and a confirmed pass status.
