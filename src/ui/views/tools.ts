/**
 * src/ui/views/tools.ts
 *
 * Dedicated showcase for the Chatalmanac tool suite:
 * - Inactivity & Silence Tracker
 * - Message & Word Analytics
 * - Peak Hours & Weekly Heatmap
 * - Head-to-Head Comparison
 * - Legal Evidence & PDF Record
 */

import { t } from '../../locales/index.ts';
import { loadSampleChat, resetToLanding, getState, navigateTo, navigateToResultTab } from '../app.ts';
import { renderFooter } from '../components/footer.ts';

export function renderTools(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'tools-page animate-fade-in';

  const locale = t();

  page.innerHTML = `
    <div class="container">
      <!-- ── Header ── -->
      <div class="tools-hero">
        <h1 class="section-heading tools-hero__title">${locale.toolsPage.title}</h1>
        <p class="tools-hero__subtitle text-muted">${locale.toolsPage.subtitle}</p>
        <div class="tools-hero__actions">
          <button class="btn btn--primary btn--md" id="tools-hero-demo-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon points="5,3 13,8 5,13" fill="currentColor"/>
            </svg>
            ${locale.toolsPage.tryDemo}
          </button>
          <button class="btn btn--secondary btn--md" id="tools-hero-open-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 13h12M8 3v7m-3-3l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${locale.landing.dropzoneLabel}
          </button>
        </div>
      </div>

      <!-- ── Tools Grid ── -->
      <div class="tools-grid">
        <!-- 1. Inactivity & Silence Tracker -->
        <div class="card tool-card">
          <div class="tool-card__header">
            <div class="tool-card__icon tool-card__icon--amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span class="badge badge--amber">${locale.toolsPage.inactivity.badge}</span>
          </div>
          <h2 class="tool-card__title">${locale.toolsPage.inactivity.title}</h2>
          <p class="tool-card__desc text-muted text-sm">${locale.toolsPage.inactivity.desc}</p>
          <ul class="tool-card__bullets text-xs text-subtle" role="list">
            <li>Quantifies response latencies per person</li>
            <li>Calculates longest periods without messages</li>
            <li>Tracks conversation streak consistency</li>
          </ul>
          <div class="tool-card__footer">
            <button class="btn btn--ghost btn--sm tool-launch-btn" data-target="activity" type="button">
              Explore Tracker →
            </button>
          </div>
        </div>

        <!-- 2. Message & Vocabulary Analytics -->
        <div class="card tool-card">
          <div class="tool-card__header">
            <div class="tool-card__icon tool-card__icon--teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <span class="badge badge--teal">${locale.toolsPage.counter.badge}</span>
          </div>
          <h2 class="tool-card__title">${locale.toolsPage.counter.title}</h2>
          <p class="tool-card__desc text-muted text-sm">${locale.toolsPage.counter.desc}</p>
          <ul class="tool-card__bullets text-xs text-subtle" role="list">
            <li>Total word & character breakdowns</li>
            <li>Top words excluding common stop words</li>
            <li>Emoji distribution and frequency ranking</li>
          </ul>
          <div class="tool-card__footer">
            <button class="btn btn--ghost btn--sm tool-launch-btn" data-target="words" type="button">
              Explore Analytics →
            </button>
          </div>
        </div>

        <!-- 3. Peak Hours & Weekly Heatmap -->
        <div class="card tool-card">
          <div class="tool-card__header">
            <div class="tool-card__icon tool-card__icon--purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span class="badge badge--purple">${locale.toolsPage.heatmap.badge}</span>
          </div>
          <h2 class="tool-card__title">${locale.toolsPage.heatmap.title}</h2>
          <p class="tool-card__desc text-muted text-sm">${locale.toolsPage.heatmap.desc}</p>
          <ul class="tool-card__bullets text-xs text-subtle" role="list">
            <li>24-hour hour-by-hour messaging intensity</li>
            <li>Day-of-week breakdown (Sunday–Saturday)</li>
            <li>Time-of-day slots: Night, Morning, Afternoon, Evening</li>
          </ul>
          <div class="tool-card__footer">
            <button class="btn btn--ghost btn--sm tool-launch-btn" data-target="activity" type="button">
              Explore Heatmap →
            </button>
          </div>
        </div>

        <!-- 4. Head-to-Head Comparison -->
        <div class="card tool-card">
          <div class="tool-card__header">
            <div class="tool-card__icon tool-card__icon--teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span class="badge badge--teal">${locale.toolsPage.compare.badge}</span>
          </div>
          <h2 class="tool-card__title">${locale.toolsPage.compare.title}</h2>
          <p class="tool-card__desc text-muted text-sm">${locale.toolsPage.compare.desc}</p>
          <ul class="tool-card__bullets text-xs text-subtle" role="list">
            <li>Side-by-side messaging share percentage</li>
            <li>Who replies faster & who writes longer</li>
            <li>Who starts and ends more conversations</li>
          </ul>
          <div class="tool-card__footer">
            <button class="btn btn--ghost btn--sm tool-launch-btn" data-target="compare" type="button">
              Explore Duel →
            </button>
          </div>
        </div>

        <!-- 5. PDF Summary Report -->
        <div class="card tool-card">
          <div class="tool-card__header">
            <div class="tool-card__icon tool-card__icon--amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <span class="badge badge--amber">${locale.toolsPage.evidence.badge}</span>
          </div>
          <h2 class="tool-card__title">${locale.toolsPage.evidence.title}</h2>
          <p class="tool-card__desc text-muted text-sm">${locale.toolsPage.evidence.desc}</p>
          <ul class="tool-card__bullets text-xs text-subtle" role="list">
            <li>Structured timestamped summary printout</li>
            <li>Full CSV export with UTF-8 BOM encoding</li>
            <li>Clean JSON backup for personal or team records</li>
          </ul>
          <div class="tool-card__footer">
            <button class="btn btn--ghost btn--sm tool-launch-btn" data-target="export" type="button">
              Explore Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach button events
  const demoBtn = page.querySelector('#tools-hero-demo-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      loadSampleChat();
    });
  }

  const openBtn = page.querySelector('#tools-hero-open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      resetToLanding();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Tool card launch buttons
  page.querySelectorAll<HTMLButtonElement>('.tool-launch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset['target'];
      if (target === 'activity') {
        navigateToResultTab('activity');
      } else if (target === 'words') {
        navigateToResultTab('words');
      } else if (target === 'compare') {
        navigateToResultTab('compare');
      } else if (target === 'export') {
        navigateToResultTab('overview', { scrollTo: '#export-panel' });
      } else {
        const state = getState();
        if (state.stats) {
          navigateTo('results');
        } else {
          loadSampleChat();
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  page.appendChild(renderFooter());
  return page;
}
