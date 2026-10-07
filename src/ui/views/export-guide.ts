/**
 * src/ui/views/export-guide.ts
 *
 * Bespoke step-by-step WhatsApp export walkthrough:
 * - Segmented switcher for Apple iOS and Google Android
 * - Visual step timeline with glowing step numbers and instructions
 * - Highlighting of "Without Media" selection
 * - Comparison card detailing why media-free export is 50x faster and privacy-safe
 * - Direct inline launcher to test with sample chat or open user file
 */

import { t } from '../../locales/index.ts';
import { loadSampleChat, resetToLanding } from '../app.ts';
import { renderFooter } from '../components/footer.ts';

export function renderExportGuide(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'export-guide-page animate-fade-in';

  let currentPlatform: 'ios' | 'android' = 'ios';

  function build(): void {
    const locale = t();
    page.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'container';

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'guide-hero';
    header.innerHTML = `
      <div class="badge badge--teal">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
          <polyline points="8 4 8 8 11 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        ${locale.howToExport.badge}
      </div>
      <h1 class="section-heading guide-hero__title">${locale.howToExport.title}</h1>
      <p class="guide-hero__subtitle text-muted">${locale.howToExport.subtitle}</p>

      <!-- Segmented Platform Switcher -->
      <div class="guide-platform-tabs" role="tablist" aria-label="Device platforms">
        <button class="guide-tab-btn ${currentPlatform === 'ios' ? 'guide-tab-btn--active' : ''}"
                id="tab-btn-ios"
                role="tab"
                aria-selected="${currentPlatform === 'ios'}"
                type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.08 1.74-.95 2.78 1 .08 2.05-.53 2.68-1.28z"/>
          </svg>
          ${locale.howToExport.ios.label}
        </button>

        <button class="guide-tab-btn ${currentPlatform === 'android' ? 'guide-tab-btn--active' : ''}"
                id="tab-btn-android"
                role="tab"
                aria-selected="${currentPlatform === 'android'}"
                type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 4.26 6 5.92 6 7.8H18c0-1.88-.97-3.54-2.47-4.64zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
          ${locale.howToExport.android.label}
        </button>
      </div>
    `;
    container.appendChild(header);

    // ── Step Timeline ────────────────────────────────────────────────────────
    const stepsData = currentPlatform === 'ios'
      ? locale.howToExport.ios.steps
      : locale.howToExport.android.steps;

    const timeline = document.createElement('div');
    timeline.className = 'guide-timeline';

    const stepTitles = currentPlatform === 'ios'
      ? [
          'Select your chat',
          'Open Chat Details',
          'Choose "Export Chat"',
          'Select "Without Media"',
          'Drop into Chatalmanac',
        ]
      : [
          'Select your chat',
          'Open conversation menu',
          'Select More → Export chat',
          'Select "Without Media"',
          'Drop into Chatalmanac',
        ];

    stepsData.forEach((instruction, idx) => {
      const isCritical = idx === 3; // "Without Media" step
      const stepCard = document.createElement('div');
      stepCard.className = `guide-step card ${isCritical ? 'guide-step--highlight' : ''}`;
      stepCard.innerHTML = `
        <div class="guide-step__indicator">
          <span class="guide-step__num">0${idx + 1}</span>
          ${idx < stepsData.length - 1 ? '<div class="guide-step__line" aria-hidden="true"></div>' : ''}
        </div>
        <div class="guide-step__content">
          <div class="guide-step__header">
            <h3 class="guide-step__title">${stepTitles[idx]}</h3>
            ${isCritical ? '<span class="badge badge--teal">Crucial Step</span>' : ''}
          </div>
          <p class="guide-step__desc">${instruction}</p>
        </div>
      `;
      timeline.appendChild(stepCard);
    });

    container.appendChild(timeline);

    // ── Why "Without Media" Deep Dive ────────────────────────────────────────
    const whyCard = document.createElement('div');
    whyCard.className = 'guide-why card';
    whyCard.innerHTML = `
      <div class="guide-why__header">
        <div class="badge badge--purple">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1L2 4v4c0 3.5 2.5 6.8 6 8 3.5-1.2 6-4.5 6-8V4L8 1z" fill="currentColor"/>
          </svg>
          ${locale.howToExport.whyWithoutMedia.fastTag}
        </div>
        <h2 class="guide-why__title">${locale.howToExport.whyWithoutMedia.title}</h2>
        <p class="guide-why__desc text-muted">${locale.howToExport.whyWithoutMedia.summary}</p>
      </div>

      <div class="guide-why__grid">
        <div class="guide-why__box guide-why__box--good">
          <div class="guide-why__box-head">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8l3 3 7-7" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="font-medium">Without Media (Recommended)</span>
          </div>
          <ul class="text-xs text-muted" role="list">
            <li>File size typically 1 MB – 5 MB</li>
            <li>Instant generation in seconds</li>
            <li>Zero bandwidth, runs 100% offline</li>
            <li>Contains all messages, words & timestamps</li>
          </ul>
        </div>

        <div class="guide-why__box guide-why__box--bad">
          <div class="guide-why__box-head">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="var(--color-text-subtle)" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="font-medium text-muted">Attach Media (Unnecessary)</span>
          </div>
          <ul class="text-xs text-muted" role="list">
            <li>File size 500 MB – 2 GB</li>
            <li>Extremely slow to download and export</li>
            <li>Photos, voice notes and videos are ignored</li>
            <li>Unnecessary device storage overhead</li>
          </ul>
        </div>
      </div>
    `;
    container.appendChild(whyCard);

    // ── Instant Action Zone ──────────────────────────────────────────────────
    const actionCard = document.createElement('div');
    actionCard.className = 'guide-action-zone card';
    actionCard.innerHTML = `
      <div class="guide-action-zone__inner">
        <div>
          <h2 class="font-semibold text-base">${locale.howToExport.readyCta}</h2>
          <p class="text-muted text-sm" style="margin-top:var(--space-1)">
            Drop your generated text export into Chatalmanac to inspect full stats, timelines, and response habits.
          </p>
        </div>
        <div class="guide-action-zone__buttons">
          <button class="btn btn--primary btn--md" id="guide-open-file-btn" type="button">
            ${locale.howToExport.dropCta}
          </button>
          <button class="btn btn--secondary btn--md" id="guide-sample-btn" type="button">
            ${locale.howToExport.sampleCta}
          </button>
        </div>
      </div>
    `;
    container.appendChild(actionCard);

    page.appendChild(container);
    page.appendChild(renderFooter());

    // ── Platform Switcher Handlers ───────────────────────────────────────────
    const iosBtn = page.querySelector('#tab-btn-ios');
    if (iosBtn) {
      iosBtn.addEventListener('click', () => {
        if (currentPlatform !== 'ios') {
          currentPlatform = 'ios';
          build();
        }
      });
    }

    const androidBtn = page.querySelector('#tab-btn-android');
    if (androidBtn) {
      androidBtn.addEventListener('click', () => {
        if (currentPlatform !== 'android') {
          currentPlatform = 'android';
          build();
        }
      });
    }

    // ── Action Buttons ───────────────────────────────────────────────────────
    const openFileBtn = page.querySelector('#guide-open-file-btn');
    if (openFileBtn) {
      openFileBtn.addEventListener('click', () => {
        resetToLanding();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const sampleBtn = page.querySelector('#guide-sample-btn');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        loadSampleChat();
      });
    }
  }

  build();
  return page;
}
