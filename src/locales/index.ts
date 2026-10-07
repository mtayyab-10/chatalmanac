/**
 * src/locales/index.ts — locale selector and i18n utilities
 */

import { en } from './en.ts';
import type { Locale } from './en.ts';

// ─── Supported locales ────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES = ['en', 'ur', 'ar', 'fr'] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

// ─── Lazy locale loaders ──────────────────────────────────────────────────────

const loaders: Record<LocaleCode, () => Promise<{ default: Locale }>> = {
  en: async () => ({ default: en }),
  ur: async () => import('./ur.ts') as Promise<{ default: Locale }>,
  ar: async () => import('./ar.ts') as Promise<{ default: Locale }>,
  fr: async () => import('./fr.ts') as Promise<{ default: Locale }>,
};

// ─── State ────────────────────────────────────────────────────────────────────

let _current: Locale = en;
let _code: LocaleCode = 'en';

// ─── Public API ───────────────────────────────────────────────────────────────

export function t(): Locale {
  return _current;
}

export function currentLocale(): LocaleCode {
  return _code;
}

/** Detect the best locale from browser settings. */
export function detectLocale(): LocaleCode {
  const preferred = navigator.languages ?? [navigator.language];
  for (const lang of preferred) {
    const code = lang.slice(0, 2).toLowerCase() as LocaleCode;
    if (SUPPORTED_LOCALES.includes(code)) return code;
  }
  return 'en';
}

/** Load and activate a locale. */
export async function setLocale(code: LocaleCode): Promise<void> {
  const mod = await loaders[code]();
  _current = mod.default;
  _code = code;

  // Update document direction and lang attribute
  document.documentElement.lang = code;
  document.documentElement.dir = _current.dir;

  // Store preference
  try {
    localStorage.setItem('chatalmanac_locale', code);
  } catch {
    // Storage may be unavailable — ignore
  }

  // Dispatch event so components can re-render
  document.dispatchEvent(new CustomEvent('localechange', { detail: code }));
}

/** Read stored locale preference or detect from browser. */
export function getSavedOrDetectedLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem('chatalmanac_locale') as LocaleCode | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // Ignore
  }
  return detectLocale();
}

export type { Locale };
