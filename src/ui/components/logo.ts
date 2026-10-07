/**
 * src/ui/components/logo.ts
 *
 * Chatalmanac Almanac Ring logo — SVG, inline, no external dependencies.
 * The mark is a circular teal ring enclosing a bar chart inside a chat bubble.
 */

export function renderLogo(size: number = 36): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  svg.innerHTML = `
    <!-- Outer ring -->
    <circle cx="18" cy="18" r="16" stroke="var(--color-accent)" stroke-width="2"/>
    <!-- Chat bubble body -->
    <path d="M9 12h18v11a2 2 0 0 1-2 2H12l-4 3v-3a2 2 0 0 1 0-4V12z"
          fill="var(--color-accent)" opacity="0.15"/>
    <path d="M9 12h18v11a2 2 0 0 1-2 2H12l-4 3v-3a2 2 0 0 1 0-4V12z"
          stroke="var(--color-accent)" stroke-width="1.5" stroke-linejoin="round"/>
    <!-- Bar chart inside bubble -->
    <rect x="12" y="19" width="3" height="3" rx="0.5" fill="var(--color-accent)"/>
    <rect x="16.5" y="16" width="3" height="6" rx="0.5" fill="var(--color-accent)"/>
    <rect x="21" y="13" width="3" height="9" rx="0.5" fill="var(--color-accent)"/>
  `;

  return svg;
}

export function renderWordmark(includeTagline = false): HTMLElement {
  const el = document.createElement('div');
  el.className = 'logo-wordmark';
  el.innerHTML = `
    <span class="logo-chat">chat</span><span class="logo-almanac">almanac</span>
    ${includeTagline ? '<span class="logo-tagline">chat analytics</span>' : ''}
  `;
  return el;
}
