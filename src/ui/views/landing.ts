/**
 * src/ui/views/landing.ts
 *
 * The landing page — hero, import zone, FAQ, and footer.
 */

import { renderImportZone } from '../components/import-zone.ts';
import { renderFooter } from '../components/footer.ts';
import { loadSampleChat } from '../app.ts';
import { renderLineChart, renderBarChart } from '../components/charts.ts';
import { t } from '../../locales/index.ts';

export function renderLanding(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'landing-page animate-fade-in';
  page.id = 'landing-page';

  function build(): void {
    const locale = t();
    const isRtl = locale.dir === 'rtl';
    page.innerHTML = '';

    // ── Hero ──────────────────────────────────────────────────────────────────
    const hero = document.createElement('section');
    hero.className = 'hero section';
    hero.setAttribute('aria-label', 'Import your chat');

    hero.innerHTML = `
      <div class="container">
        <div class="hero__inner">
          <div class="hero__copy">
            <div class="badge badge--teal hero__badge">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1L2 4v4c0 3.5 2.5 6.8 6 8 3.5-1.2 6-4.5 6-8V4L8 1z"
                      fill="var(--color-accent)" opacity="0.9"/>
              </svg>
              ${locale.landing.badge || '100% Client-Side · Private & Offline-Ready'}
            </div>
            <h1 class="hero__headline">${locale.landing.headline}</h1>
            <p class="hero__subheadline">${locale.landing.subheadline}</p>
            <ul class="hero__bullets" aria-label="Key features">
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l4 4 6-6" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${locale.landing.bullet1 || 'Your file never leaves your device'}
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l4 4 6-6" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${locale.landing.bullet2 || 'No account, no sign-up, no ads'}
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l4 4 6-6" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${locale.landing.bullet3 || 'Works offline once loaded'}
              </li>
            </ul>
          </div>
          <div class="hero__import" id="hero-import-zone">
          </div>
        </div>
      </div>
    `;

    // Inject import zone
    const importMount = hero.querySelector('#hero-import-zone') as HTMLElement;
    importMount.appendChild(
      renderImportZone(() => loadSampleChat()),
    );

    page.appendChild(hero);

    // ── Interactive Analytics Preview Section ──────────────────────────────────
    const previewSection = document.createElement('section');
    previewSection.className = 'landing-preview-section';
    previewSection.setAttribute('aria-label', 'Analytics preview');

    const timelineData = [
      { label: 'Oct', value: 140 },
      { label: 'Nov', value: 380 },
      { label: 'Dec', value: 650 },
      { label: 'Jan', value: 920 },
      { label: 'Feb', value: 780 },
      { label: 'Mar', value: 1120 },
    ];
    const timelineSvg = renderLineChart({ data: timelineData, height: 140, fill: true });

    const hourlyData = [5, 2, 0, 0, 0, 8, 25, 45, 80, 95, 70, 60, 85, 90, 110, 140, 175, 210, 260, 240, 180, 130, 75, 30];
    const hourlySvg = renderBarChart({
      data: hourlyData,
      labels: Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? `${i}:00` : ''),
      height: 140,
    });

    previewSection.innerHTML = `
      <div class="container">
        <div class="section-header" style="margin-bottom:var(--space-6);text-align:start">
          <div class="badge badge--teal" style="margin-bottom:var(--space-2)">Preview Your Results</div>
          <h2 class="section-heading" style="margin-bottom:var(--space-2)">Visual insights from every conversation</h2>
          <p class="text-muted" style="margin:0;max-width:none;text-align:start">
            Discover conversation milestones, peak messaging hours, response velocities, and head-to-head dynamics.
          </p>
        </div>

        <div class="landing-preview-grid">
          <!-- Card 1: Chat Volume Timeline -->
          <div class="card landing-preview-card">
            <div class="landing-preview-card__header">
              <span class="preview-tag">Activity Timeline</span>
              <h3 class="preview-title">Monthly message trends</h3>
            </div>
            <div class="landing-preview-chart" id="preview-timeline-mount"></div>
          </div>

          <!-- Card 2: Peak Hours Heatmap / Bar -->
          <div class="card landing-preview-card">
            <div class="landing-preview-card__header">
              <span class="preview-tag">Peak Hours</span>
              <h3 class="preview-title">Active times across 24 hours</h3>
            </div>
            <div class="landing-preview-chart" id="preview-hourly-mount"></div>
          </div>

          <!-- Card 3: Head-to-Head Duel -->
          <div class="card landing-preview-card">
            <div class="landing-preview-card__header">
              <span class="preview-tag">Head-to-Head Duel</span>
              <h3 class="preview-title">Participant dynamics & reply speed</h3>
            </div>
            <div class="landing-preview-duel">
              <div class="preview-duel-header">
                <span class="preview-duel-name" style="color:var(--chart-1)">Hassan (54%)</span>
                <span class="compare-vs" style="margin-top:0">vs</span>
                <span class="preview-duel-name" style="color:var(--chart-2)">Ahmad (46%)</span>
              </div>
              <div class="compare-split-track" style="margin-bottom:8px">
                <div class="compare-split-fill-a" style="width:54%;background:var(--chart-1)"></div>
                <div class="compare-split-fill-b" style="width:46%;background:var(--chart-2)"></div>
              </div>
              <div class="preview-mini-metric">
                <span style="color:var(--chart-1);font-weight:600">1.2 min</span>
                <span class="text-xs text-muted">Median reply time</span>
                <span style="color:var(--chart-2);font-weight:600">2.4 min</span>
              </div>
              <div class="preview-mini-metric">
                <span style="color:var(--chart-1);font-weight:600">42</span>
                <span class="text-xs text-muted">Discussions started</span>
                <span style="color:var(--chart-2);font-weight:600">28</span>
              </div>
            </div>
          </div>
        </div>

        <div class="landing-preview-cta">
          <button class="btn btn--secondary btn--md" id="landing-preview-demo-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon points="5,3 13,8 5,13" fill="currentColor"/>
            </svg>
            ${locale.landing.tryDemoBtn || 'Try demo chat'}
          </button>
        </div>
      </div>
    `;

    previewSection.querySelector('#preview-timeline-mount')!.appendChild(timelineSvg);
    previewSection.querySelector('#preview-hourly-mount')!.appendChild(hourlySvg);
    previewSection.querySelector('#landing-preview-demo-btn')!.addEventListener('click', () => {
      loadSampleChat();
    });

    page.appendChild(previewSection);

    // ── Stats preview strip ───────────────────────────────────────────────────
    const strip = document.createElement('section');
    strip.className = 'stats-strip';
    strip.setAttribute('aria-label', 'What you will see');
    strip.innerHTML = `
      <div class="container">
        <div class="stats-strip__inner">
          ${[
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', label: 'Total messages', value: '14,382' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', label: 'Active days', value: '347' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>', label: 'Longest streak', value: '42 days' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', label: 'Avg. response', value: '4 min' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>', label: 'Top sender', value: 'You' },
          ].map(({ icon, label, value }) => `
            <div class="stats-strip__item">
              <span class="stats-strip__icon" aria-hidden="true">${icon}</span>
              <span class="stats-strip__value">${value}</span>
              <span class="stats-strip__label text-muted">${label}</span>
            </div>
          `).join('')}
        </div>
        <p class="stats-strip__note text-subtle text-xs">
          Example numbers — you will see your own after importing a chat.
        </p>
      </div>
    `;
    page.appendChild(strip);

    // ── FAQ ───────────────────────────────────────────────────────────────────
    const faq = document.createElement('section');
    faq.className = 'faq section section--sm';
    faq.setAttribute('aria-label', locale.faq.title);
    faq.innerHTML = `
      <div class="container">
        <h2 class="section-heading">${locale.faq.title}</h2>
        <div class="faq__list">
          ${locale.faq.items.map((item, i) => {
            const q = isRtl ? item.q.replace(/\?/g, '؟') : item.q;
            return `
            <details class="faq__item" id="faq-item-${i}">
              <summary class="faq__question"><span class="faq__question-text">${q}</span></summary>
              <p class="faq__answer">${item.a}</p>
            </details>
          `;
          }).join('')}
        </div>
      </div>
    `;
    page.appendChild(faq);

    // ── Footer ────────────────────────────────────────────────────────────────
    page.appendChild(renderFooter());
  }

  build();
  return page;
}
