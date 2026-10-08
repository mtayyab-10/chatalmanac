/**
 * src/ui/theme.ts
 *
 * Theme manager for Chatalmanac (dark / light mode).
 * Preserves user preference in localStorage and updates the root attribute.
 */

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'chatalmanac_theme';

export function getTheme(): Theme {
  // 1. Check DOM attribute set by index.html (source of truth on render)
  const domTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
  if (domTheme === 'dark' || domTheme === 'light') {
    return domTheme;
  }

  // 2. Check saved localStorage preference
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {}

  // 3. Default fallback to light mode
  return 'light';
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  document.documentElement.setAttribute('data-theme', theme);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function initTheme(): void {
  const theme = getTheme();
  setTheme(theme);
}