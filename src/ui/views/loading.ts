/**
 * src/ui/views/loading.ts
 *
 * Loading / progress view shown while parsing and analyzing.
 * Also handles error states and the manual format selector.
 */

import { getState, retryWithOptions, resetToLanding } from '../app.ts';
import { t } from '../../locales/index.ts';
import type { } from '../../parser/types.ts';

export function renderLoading(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'loading-page animate-fade-in-fast';
  page.setAttribute('role', 'main');
  page.setAttribute('aria-live', 'polite');

  function build(): void {
    const state = getState();
    const locale = t();

    page.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'loading-inner';

    if (state.error) {
      // ── Error state ─────────────────────────────────────────────────────────
      inner.innerHTML = `
        <div class="loading-error animate-fade-in">
          <div class="loading-error__icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="var(--color-error)" stroke-width="2"/>
              <path d="M24 14v13M24 31v3" stroke="var(--color-error)" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="loading-error__title">Could not read this file</h2>
          <p class="loading-error__message">${state.error}</p>

          ${state.needsFormatSelection ? `
          <div class="format-selector card" id="format-selector">
            <p class="format-selector__label font-medium">
              ${locale.dateFormatSelector.label}
            </p>
            <div class="format-selector__options">
              <label class="format-option">
                <input type="radio" name="date-order" value="dmy" checked>
                <span>${locale.dateFormatSelector.dmy}</span>
              </label>
              <label class="format-option">
                <input type="radio" name="date-order" value="mdy">
                <span>${locale.dateFormatSelector.mdy}</span>
              </label>
              <label class="format-option">
                <input type="radio" name="date-order" value="ymd">
                <span>${locale.dateFormatSelector.ymd}</span>
              </label>
            </div>
            <button class="btn btn--primary" id="retry-btn" type="button">
              ${locale.dateFormatSelector.retry}
            </button>
          </div>
          ` : ''}

          <button class="btn btn--secondary" id="back-btn" type="button">
            Open a different file
          </button>
        </div>
      `;

      // Wire retry
      const retryBtn = inner.querySelector<HTMLButtonElement>('#retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          const selected = inner.querySelector<HTMLInputElement>('input[name="date-order"]:checked');
          const raw = selected?.value ?? 'dmy';
          const dateOrder = raw as 'dmy' | 'mdy' | 'ymd';
          retryWithOptions({ dateOrder });
        });
      }

      // Wire back
      const backBtn = inner.querySelector<HTMLButtonElement>('#back-btn')!;
      backBtn.addEventListener('click', () => resetToLanding());

    } else {
      // ── Progress state ───────────────────────────────────────────────────────
      const percent = state.progress;
      const stageKey = state.progressStage as keyof typeof locale.progress;
      const stageLabel = locale.progress[stageKey] ?? locale.progress.reading;

      inner.innerHTML = `
        <div class="loading-progress">
          <div class="loading-ring" aria-hidden="true">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="32" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="40" cy="40" r="32"
                stroke="var(--color-accent)"
                stroke-width="4"
                stroke-linecap="round"
                stroke-dasharray="${(2 * Math.PI * 32).toFixed(2)}"
                stroke-dashoffset="${((1 - percent / 100) * 2 * Math.PI * 32).toFixed(2)}"
                transform="rotate(-90 40 40)"
                style="transition: stroke-dashoffset 0.3s ease"/>
              <text x="40" y="45" text-anchor="middle"
                fill="var(--color-accent)"
                font-family="var(--font-sans)"
                font-size="14"
                font-weight="600">
                ${Math.round(percent)}%
              </text>
            </svg>
          </div>

          <div class="loading-text">
            <h2 class="loading-title" aria-live="polite">${stageLabel}</h2>
            ${state.filename ? `
              <p class="loading-filename text-muted text-sm">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="display:inline;vertical-align:middle">
                  <path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
                        stroke="currentColor" stroke-width="1.2" fill="none"/>
                  <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.2"/>
                </svg>
                ${state.filename}
              </p>
            ` : ''}
            <p class="loading-hint text-subtle text-xs">${locale.progress.estimatedTime}</p>
          </div>

          <div class="loading-stages" aria-label="Progress stages">
            ${(['reading', 'detecting', 'parsing', 'computing'] as const).map((stage) => {
              const stages = ['reading', 'detecting', 'parsing', 'computing', 'done'];
              const current = stages.indexOf(state.progressStage);
              const mine = stages.indexOf(stage);
              const isDone = mine < current;
              const isActive = mine === current;
              return `
                <div class="loading-stage ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
                  <div class="loading-stage__dot" aria-hidden="true">
                    ${isDone ? `
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--color-accent)" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                    ` : ''}
                  </div>
                  <span>${locale.progress[stage]}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    page.appendChild(inner);
  }

  build();

  return page;
}
