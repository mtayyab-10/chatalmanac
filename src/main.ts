import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';

// Initialize performance & web analytics
injectSpeedInsights();
inject();
/**
 * src/main.ts
 *
 * Application entry point.
 * Initializes the locale, mounts the nav, and renders the correct view
 * based on app state. Subscribes to state changes for live re-rendering.
 */

import './ui/styles/global.css';
import './ui/styles/components.css';

import { getSavedOrDetectedLocale, setLocale } from './locales/index.ts';
import { renderNav } from './ui/components/nav.ts';
import { renderLanding } from './ui/views/landing.ts';
import { renderLoading } from './ui/views/loading.ts';
import { renderResults } from './ui/views/results.ts';
import { renderSaved } from './ui/views/saved.ts';
import { renderExportPanel } from './ui/components/export-panel.ts';
import { subscribe, getState } from './ui/app.ts';
import type { AppView } from './ui/app.ts';
import { renderPrivacyVerify } from './ui/components/privacy-verify.ts';

import { renderFooter } from './ui/components/footer.ts';
import { renderExportGuide } from './ui/views/export-guide.ts';
import { renderTools } from './ui/views/tools.ts';
import { initTheme } from './ui/theme.ts';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Prevent browser from restoring scroll position when switching views
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // 0. Initialize dark/light mode
  initTheme();

  // 1. Detect and load locale before rendering anything
  const locale = getSavedOrDetectedLocale();
  await setLocale(locale);

  // 2. Mount the skeleton
  const app = document.getElementById('app');
  if (!app) throw new Error('#app element not found');

  const nav = renderNav();
  app.appendChild(nav);

  const viewMount = document.createElement('div');
  viewMount.id = 'view-mount';
  viewMount.style.cssText = 'flex:1;display:flex;flex-direction:column;';
  app.appendChild(viewMount);

  // 3. Initial render
  let currentView: AppView | null = null;
  let currentStats: unknown = null;
  let loadingEl: HTMLElement | null = null;

  function render(): void {
    const state = getState();

    if (state.view === 'loading') {
      // Loading view is special — it updates in-place rather than replacing
      if (currentView !== 'loading') {
        viewMount.innerHTML = '';
        loadingEl = renderLoading();
        viewMount.appendChild(loadingEl);
        currentView = 'loading';
        currentStats = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        // Replace loading view to reflect updated progress/error
        if (loadingEl) {
          const newLoading = renderLoading();
          viewMount.replaceChild(newLoading, loadingEl);
          loadingEl = newLoading;
        }
      }
    } else if (state.view === 'landing') {
      if (currentView !== 'landing') {
        viewMount.innerHTML = '';
        viewMount.appendChild(renderLanding());
        currentView = 'landing';
        currentStats = null;
        loadingEl = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else if (state.view === 'results' && state.stats) {
      if (currentView !== 'results' || currentStats !== state.stats) {
        currentView = 'results';
        currentStats = state.stats;
        loadingEl = null;
        viewMount.innerHTML = '';
        const resultsEl = renderResults(state.stats);
        // Append the export/save panel below the results tabs
        resultsEl.appendChild(renderExportPanel(state.stats));
        resultsEl.appendChild(renderFooter());
        viewMount.appendChild(resultsEl);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else if (state.view === 'saved') {
      if (currentView !== 'saved') {
        viewMount.innerHTML = '';
        currentView = 'saved';
        currentStats = null;
        loadingEl = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        renderSaved().then((el) => {
          el.appendChild(renderFooter());
          viewMount.appendChild(el);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        });
      }
    } else if (state.view === 'how-to-export') {
      if (currentView !== 'how-to-export') {
        viewMount.innerHTML = '';
        viewMount.appendChild(renderExportGuide());
        currentView = 'how-to-export';
        currentStats = null;
        loadingEl = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else if (state.view === 'tools') {
      if (currentView !== 'tools') {
        viewMount.innerHTML = '';
        viewMount.appendChild(renderTools());
        currentView = 'tools';
        currentStats = null;
        loadingEl = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    } else if (state.view === 'privacy') {
      if (currentView !== 'privacy') {
        viewMount.innerHTML = '';
        viewMount.appendChild(renderPrivacy());
        currentView = 'privacy';
        currentStats = null;
        loadingEl = null;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }

    // Update page title
    document.title = state.view === 'results'
      ? 'Your results — Chatalmanac'
      : state.view === 'saved'
      ? 'Saved analyses — Chatalmanac'
      : state.view === 'tools'
      ? 'Chat analysis tools — Chatalmanac'
      : state.view === 'how-to-export'
      ? 'How to export your chat — Chatalmanac'
      : 'Chatalmanac — chat analytics';
  }

  subscribe(render);
  document.addEventListener('localechange', () => {
    currentView = null;
    currentStats = null;
    render();
  });
  render();
}

// ─── Privacy page ─────────────────────────────────────────────────────────────

function renderPrivacy(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'privacy-page animate-fade-in';

  page.innerHTML = `
    <div class="container privacy-page__container">
      <h1 class="section-heading">Privacy policy</h1>
      <p class="text-muted" style="margin-bottom:var(--space-8)">Last updated: October 2024</p>

      <div class="privacy-sections">
        <section class="privacy-section">
          <h2>What we do and do not collect</h2>
          <p>Chatalmanac does not collect any data. Your chat file is read inside your browser using
          JavaScript and is never transmitted to any server. The analysis runs entirely on your device.</p>
        </section>

        <section class="privacy-section">
          <h2>How to verify this</h2>
          <p>Turn off your internet connection, then open a chat file. The analyzer still works.
          The complete source code is on GitHub under the MIT license.
          Below is a step-by-step guide to confirming the privacy promise with your own browser tools.</p>
          <div id="pv-mount"></div>
        </section>

        <section class="privacy-section">
          <h2>Optional local storage</h2>
          <p>After analysis, you may choose to save a compact summary of results to your browser's
          local storage. This summary contains statistics (numbers and counts), not raw message text.
          It stays on your device. Clearing your browser data removes it.</p>
        </section>

        <section class="privacy-section">
          <h2>Cookies and tracking</h2>
          <p>Chatalmanac does not use cookies, analytics services, advertising scripts,
          or any third-party services. There are no trackers of any kind.</p>
        </section>

        <section class="privacy-section">
          <h2>Browser extensions</h2>
          <p>Be aware that browser extensions you have installed may be able to read the content
          of web pages, including this one. If you are concerned about privacy, consider using
          a browser profile with no extensions installed when using this tool.</p>
        </section>

        <section class="privacy-section">
          <h2>The people in your chat</h2>
          <p>Your chat contains messages from other people who may not know you are analyzing it.
          Please be respectful of their privacy. Do not share results in ways that could harm
          or embarrass the people in your conversation.</p>
        </section>

        <section class="privacy-section">
          <h2>Contact</h2>
          <p>If you have any questions, suggestions, or privacy concerns, feel free to reach out via email at
          <a href="mailto:devixaweb@gmail.com" class="footer__contact-email">devixaweb@gmail.com</a>
          or open an issue on the GitHub repository.</p>
        </section>
      </div>
    </div>
  `;

  // Mount the interactive verify widget
  const pvMount = page.querySelector('#pv-mount');
  if (pvMount) pvMount.appendChild(renderPrivacyVerify());

  page.appendChild(renderFooter());
  return page;
}

// ─── Service Worker registration ──────────────────────────────────────────────

async function registerServiceWorker(): Promise<void> {
  // Only register in production — in dev the HMR websocket would be blocked
  // by the SW's external-request blocking logic.
  if (!('serviceWorker' in navigator)) return;

  const isDev = import.meta.env.DEV;
  if (isDev) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // Use 'all' so the SW gets updates even when the user navigates away
      updateViaCache: 'none',
    });

    // Check for updates every time the page gains focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        registration.update().catch(() => {/* network may be offline — that is fine */});
      }
    });

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (
          installing.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // A new version is ready — the user will get it on next page load.
          // We do NOT force-reload: the user may be mid-analysis.
          console.info('[chatalmanac] A new version is ready. Reload to update.');
        }
      });
    });
  } catch (err) {
    // SW registration failure is non-fatal — the app works without it.
    console.warn('[chatalmanac] Service Worker registration failed:', err);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

Promise.all([main(), registerServiceWorker()]).catch(console.error);
