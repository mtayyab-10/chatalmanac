/**
 * src/ui/theme.ts
 *
 * Theme manager for Chatalmanac (dark / light mode).
 * Preserves user preference in localStorage and updates the root attribute.
 */

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'chatalmanac_theme';

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {}
  return 'dark';
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
  localStorage.removeItem('chatalmanac_theme');
  document.documentElement.setAttribute('data-theme', 'light');
}
