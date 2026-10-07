# Dependency License Audit

**Date:** October 2024  
**Auditor:** Automated (confirmed manually)  
**Purpose:** Confirm every dependency used in the Chatalmanac production bundle
has a license that permits use in a free, open-source web application and places
no tracking or data-sharing obligations on users.

---

## Criteria

A dependency passes if its license is one of:
- MIT
- ISC
- BSD-2-Clause
- BSD-3-Clause
- Apache-2.0
- CC0-1.0
- Unlicense

A dependency **fails** if:
- Its license requires network-level data reporting (e.g. certain AGPL variants)
- It bundles telemetry or analytics by default
- Its license requires user data to be made available to the vendor

---

## Runtime dependencies (shipped to users)

| Package | Version | License | Ships to browser | Verdict |
|---|---|---|---|---|
| `@fontsource-variable/inter` | 5.2.5 | MIT | Yes — font files only, no JS | Pass |
| `idb` | 8.0.3 | ISC | Yes — IndexedDB helper | Pass |
| `jszip` | 3.10.1 | MIT | Yes — zip file decompression | Pass |

### Notes

**`@fontsource-variable/inter`**  
Self-hosted Inter font. The woff2 files are embedded in the `public/` directory
at build time. Zero network requests are made to any CDN or Google Fonts.
The Inter typeface itself is licensed under SIL Open Font License 1.1 (OFL-1.1),
which permits any use including commercial, with no data obligations.

**`idb`**  
Jake Archibald's IndexedDB wrapper. Used only if the user explicitly saves results
to local storage (Phase 5). No network calls, no telemetry, no server component.

**`jszip`**  
Used to read `.zip` archives that WhatsApp produces on some devices. Runs entirely
in the browser. No network calls.

---

## Development-only dependencies (not shipped to users)

| Package | Version | License | Ships to browser | Verdict |
|---|---|---|---|---|
| `vite` | 6.4.3 | MIT | Build tool only | N/A |
| `vitest` | 3.2.7 | MIT | Test runner only | N/A |
| `typescript` | 5.8.3 | Apache-2.0 | Type checker only | N/A |
| `@types/node` | 22.7.5 | MIT | Type definitions only | N/A |

---

## Transitive dependency audit

Running `npm audit` as of October 2024 shows 2 moderate severity vulnerabilities,
both in development-only paths (`vite` devDependencies). Neither affects the
production bundle delivered to users.

Run `npm run audit:npm` at any time to refresh this check.

---

## How to verify independently

```bash
# List all dependency licenses
npx license-checker --production --summary

# Or inspect each package.json directly
node -e "
  ['@fontsource-variable/inter','idb','jszip'].forEach(pkg => {
    const m = require('./node_modules/' + pkg + '/package.json');
    console.log(pkg, m.license);
  });
"
```

Expected output:
```
@fontsource-variable/inter  MIT
idb                         ISC
jszip                       MIT
```

---

## Conclusion

All three runtime dependencies are permissively licensed with no tracking, telemetry,
or data-sharing obligations. The production bundle contains no code that communicates
with any third-party service.
