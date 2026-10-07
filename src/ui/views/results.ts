/**
 * src/ui/views/results.ts
 *
 * Results page — displays all computed statistics.
 * Organized into tabbed sections: Overview, Per person, Compare, Timeline, Activity, Words.
 * Features: Accessible table view on every chart, keyboard shortcuts, advanced analytics.
 */

import type { SerializedStats } from '../../worker/analyzer.worker.ts';
import {
  renderBarChart,
  renderLineChart,
  renderHeatmap,
  renderShareBar,
  renderChartWithTable,
  renderHorizontalBarList,
  renderSparkline,
  chartColor,
} from '../components/charts.ts';
import { renderCompare } from '../components/compare.ts';
import { resetToLanding, getState } from '../app.ts';
import type { TabId } from '../app.ts';
import { t, currentLocale } from '../../locales/index.ts';
import { escapeHtml } from '../../utils/sanitize.ts';

/* ── SVG icon library (Lucide-style, consistent visual language) ────────── */
const ICONS = {
  messages: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  words: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  trendingUp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  flame: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  link: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  smile: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  rocket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
} as const;

const TABS: TabId[] = ['overview', 'per-person', 'compare', 'timeline', 'activity', 'words'];

export function renderResults(stats: SerializedStats): HTMLElement {
  const page = document.createElement('div');
  page.className = 'results-page animate-fade-in';
  page.setAttribute('role', 'main');

  const locale = t();

  // ── Reconstruct Maps from serialized arrays ──────────────────────────────
  const perPerson = new Map(stats.perPerson);
  const monthlyTimeline = new Map(stats.monthlyTimeline);
  const calendarHeatmap = new Map(stats.calendarHeatmap);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatDuration(ms: number): string {
    const mins = Math.round(ms / 60_000);
    if (mins < 60) return `${mins} ${locale.stats.minutes}`;
    const hrs = Math.round(ms / 3_600_000);
    if (hrs < 24) return `${hrs} ${locale.stats.hours}`;
    const days = Math.round(ms / 86_400_000);
    return `${days} ${days === 1 ? locale.stats.day : locale.stats.days}`;
  }

  function dayLabel(n: number): string {
    return `${n} ${n === 1 ? locale.stats.day : locale.stats.days}`;
  }

  function fill(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
  }

  function formatDate(ts: number): string {
    const code = currentLocale();
    const tag = code === 'ur' ? 'ur-PK' : code === 'ar' ? 'ar-SA' : code === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(ts).toLocaleDateString(tag, {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
  }

  function bigNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  }

  // ── Header strip ─────────────────────────────────────────────────────────
  const headerStrip = document.createElement('div');
  headerStrip.className = 'results-header';
  headerStrip.innerHTML = `
    <div class="container">
      <div class="results-header__inner">
        <div>
          <h1 class="results-header__title">Your chat analytics</h1>
          <p class="results-header__meta text-muted text-sm">
            ${formatDate(stats.firstMessageTs)} – ${formatDate(stats.lastMessageTs)}
            · ${stats.participants.map(escapeHtml).join(', ')}
          </p>
        </div>
        <div class="results-header__actions">
          <button class="btn btn--ghost btn--sm" id="shortcuts-help-btn" type="button"
                  aria-label="Keyboard shortcuts" title="Keyboard shortcuts (press ?)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 6h1M7 6h1M10 6h1M4 9h2M7 9h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            Shortcuts
          </button>
          <button class="btn btn--secondary btn--sm" id="new-file-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${locale.results.backToImport}
          </button>
        </div>
      </div>
    </div>
  `;

  headerStrip.querySelector('#new-file-btn')!.addEventListener('click', () => {
    document.removeEventListener('keydown', onKeyDown);
    resetToLanding();
  });
  headerStrip.querySelector('#shortcuts-help-btn')!.addEventListener('click', () => toggleShortcutsModal());
  page.appendChild(headerStrip);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabBar = document.createElement('div');
  tabBar.className = 'results-tabs';
  tabBar.setAttribute('role', 'tablist');
  tabBar.setAttribute('aria-label', 'Analytics sections');
  tabBar.innerHTML = `
    <div class="container">
      <div class="tabs-inner">
        ${TABS.map((id, i) => `
          <button class="tab-btn ${i === 0 ? 'active' : ''}" role="tab"
                  aria-selected="${i === 0}" data-tab="${id}" id="tab-${id}"
                  aria-controls="panel-${id}">
            <span class="tab-btn__key text-subtle text-xs" aria-hidden="true">${i + 1}</span>
            ${tabLabel(id, locale)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  page.appendChild(tabBar);

  // ── Panel container ──────────────────────────────────────────────────────
  const panelContainer = document.createElement('div');
  panelContainer.className = 'results-panels';

  let activeTab: TabId = getState().activeResultTab || 'overview';

  function showTab(id: TabId): void {
    activeTab = id;
    tabBar.querySelectorAll('.tab-btn').forEach((btn) => {
      const isActive = (btn as HTMLElement).dataset['tab'] === id;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    panelContainer.innerHTML = '';
    const panel = buildPanel(id);
    panel.id = `panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.className += ' animate-fade-in-fast';
    panelContainer.appendChild(panel);

    // Ensure view begins at the top of the new tab
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }

  // Handle external tab switch requests (e.g. from nav tools dropdown)
  const handleTabSwitch = (e: Event) => {
    if (!page.isConnected) {
      window.removeEventListener('switch-result-tab', handleTabSwitch);
      return;
    }
    const detail = (e as CustomEvent<{ tab: TabId; scrollTo?: string }>).detail;
    if (detail?.tab && TABS.includes(detail.tab)) {
      showTab(detail.tab);
      if (detail.scrollTo) {
        setTimeout(() => {
          const target = document.querySelector(detail.scrollTo!);
          target?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  };
  window.addEventListener('switch-result-tab', handleTabSwitch);

  // Wire tab clicks
  tabBar.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest('.tab-btn') as HTMLElement | null;
    if (!btn) return;
    const id = btn.dataset['tab'] as TabId;
    if (id) showTab(id);
  });

  // Global keyboard listeners
  const onKeyDown = (e: KeyboardEvent): void => {
    if (!page.isConnected) {
      document.removeEventListener('keydown', onKeyDown);
      return;
    }
    // Ignore keystrokes when user is typing in form inputs
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    // Number keys 1-6
    if (e.key >= '1' && e.key <= '6') {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < TABS.length) {
        e.preventDefault();
        showTab(TABS[idx]!);
      }
    } else if (e.key === 'ArrowRight') {
      const current = TABS.indexOf(activeTab);
      showTab(TABS[(current + 1) % TABS.length]!);
    } else if (e.key === 'ArrowLeft') {
      const current = TABS.indexOf(activeTab);
      showTab(TABS[(current - 1 + TABS.length) % TABS.length]!);
    } else if (e.key === 't' || e.key === 'T') {
      // Toggle all charts on the active panel
      const widgets = panelContainer.querySelectorAll('.chart-with-table');
      widgets.forEach((w) => {
        (w as unknown as { toggleView?: () => void }).toggleView?.();
      });
    } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      toggleShortcutsModal();
    } else if (e.key === 'Escape') {
      closeShortcutsModal();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  page.appendChild(panelContainer);

  // Show active tab
  showTab(activeTab);

  // ─────────────────────────────────────────────────────────────────────────
  // Panel builders
  // ─────────────────────────────────────────────────────────────────────────

  function buildPanel(id: TabId): HTMLElement {
    switch (id) {
      case 'overview':   return buildOverview();
      case 'per-person': return buildPerPerson();
      case 'compare':    return renderCompare(stats);
      case 'timeline':   return buildTimeline();
      case 'activity':   return buildActivity();
      case 'words':      return buildWords();
    }
  }

  // ── Overview ──────────────────────────────────────────────────────────────
  function buildOverview(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel container';

    const topStarter = [...new Map(stats.conversationStarters).entries()].sort((a, b) => b[1] - a[1])[0];
    const emojiTotal = stats.perPerson.reduce((s, [, p]) => s + p.emojiCount, 0);
    const spanDays = Math.max(
      1,
      Math.round((stats.lastMessageTs - stats.firstMessageTs) / 86_400_000) + 1,
    );
    const wordsPerMsg = stats.totalMessages > 0
      ? (stats.totalWords / stats.totalMessages).toFixed(1)
      : '0';
    const busiest = stats.busiestDays[0];

    const moreStats = [
      stats.currentStreakDays > 0
        ? statCard(
            locale.stats.currentStreak,
            dayLabel(stats.currentStreakDays),
            ICONS.zap,
            'compact',
            fill(locale.stats.bestStreak, { n: dayLabel(stats.longestStreakDays) }),
          )
        : '',
      stats.mediaCount > 0
        ? statCard(locale.stats.mediaCount, bigNumber(stats.mediaCount), ICONS.image)
        : '',
      stats.linkCount > 0
        ? statCard(locale.stats.linkCount, bigNumber(stats.linkCount), ICONS.link)
        : '',
      stats.deletedCount > 0
        ? statCard(locale.stats.deletedCount, stats.deletedCount.toLocaleString(), ICONS.trash)
        : '',
    ].filter(Boolean);

    const insights = [
      topStarter
        ? insightCard(
            ICONS.rocket,
            fill(locale.stats.insightStarter, {
              name: escapeHtml(topStarter[0]),
              count: topStarter[1],
            }),
          )
        : '',
      stats.longestSilence
        ? insightCard(
            ICONS.moon,
            fill(locale.stats.insightSilence, {
              duration: formatDuration(stats.longestSilence.durationMs),
              date: formatDate(stats.longestSilence.startTs),
            }),
          )
        : '',
      busiest
        ? insightCard(
            ICONS.calendar,
            fill(locale.stats.insightBusiest, {
              date: busiest.date,
              count: busiest.count.toLocaleString(),
            }),
          )
        : '',
    ].filter(Boolean);

    const monthlyVals = [...monthlyTimeline.values()];
    const messagesSparkline = monthlyVals.length >= 2 ? renderSparkline({ data: monthlyVals, width: 72, height: 20, color: 'var(--color-accent)' }).outerHTML : '';
    const wordsSparkline = monthlyVals.length >= 2 ? renderSparkline({ data: monthlyVals.map((v) => Math.round(v * 4.2)), width: 72, height: 20, color: 'var(--color-indigo)' }).outerHTML : '';

    panel.innerHTML = `
      <div class="overview-hero-row">
        ${statCard(
          locale.stats.messagesSent,
          bigNumber(stats.totalMessages),
          ICONS.messages,
          'hero',
          fill(locale.stats.avgPerDay, { n: stats.avgMessagesPerDay.toFixed(1) }),
          messagesSparkline,
        )}
        ${statCard(
          locale.stats.wordsWritten,
          bigNumber(stats.totalWords),
          ICONS.words,
          'hero',
          fill(locale.stats.wordsPerMessage, { n: wordsPerMsg }),
          wordsSparkline,
        )}
      </div>

      <div class="overview-compact-row">
        ${statCard(
          locale.stats.activeDays,
          stats.activeDays.toLocaleString(),
          ICONS.calendar,
          'compact',
          fill(locale.stats.outOfDays, { n: spanDays }),
        )}
        ${statCard(
          locale.stats.messagesPerDay,
          stats.avgMessagesPerDay.toFixed(1),
          ICONS.trendingUp,
        )}
        ${statCard(
          locale.stats.longestStreak,
          dayLabel(stats.longestStreakDays),
          ICONS.flame,
        )}
        ${statCard(
          locale.stats.emojiCount,
          emojiTotal.toLocaleString(),
          ICONS.smile,
        )}
      </div>

      ${moreStats.length > 0 ? `
        <div class="overview-more-stats" aria-label="${locale.stats.moreStats}">
          ${moreStats.join('')}
        </div>
      ` : ''}

      ${insights.length > 0 ? `
        <div class="section-block">
          <h2 class="section-subheading">${locale.stats.insightsTitle}</h2>
          <div class="overview-insights">
            ${insights.join('')}
          </div>
        </div>
      ` : ''}

      ${stats.participants.length >= 2 ? `
        <div class="card section-card">
          <h2 class="section-subheading">${locale.stats.messageShareTitle}</h2>
          <div class="share-bars"></div>
        </div>
      ` : ''}

      ${stats.conversationStarters.length > 0 ? `
        <div class="card section-card">
          <div class="section-card__header">
            <h2 class="section-subheading">${locale.stats.conversationStartersTitle}</h2>
            <span class="section-card__subtitle text-muted text-xs">${locale.stats.startersSubtitle}</span>
          </div>
          <table class="data-table" aria-label="Conversation starters">
            <thead>
              <tr>
                <th scope="col">${locale.stats.colParticipant}</th>
                <th scope="col" style="text-align: right">${locale.stats.colConversationsStarted}</th>
              </tr>
            </thead>
            <tbody>
              ${stats.conversationStarters.map(([name, count]) => `
                <tr>
                  <td>${escapeHtml(name)}</td>
                  <td style="text-align: right">${count.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${stats.busiestDays.length > 0 ? `
        <div class="card section-card">
          <div class="section-card__header">
            <h2 class="section-subheading">${locale.stats.busiestDaysTitle}</h2>
            <span class="section-card__subtitle text-muted text-xs">${locale.stats.busiestSubtitle}</span>
          </div>
          <table class="data-table" aria-label="Busiest days">
            <thead>
              <tr>
                <th scope="col">${locale.stats.colDate}</th>
                <th scope="col" style="text-align: right">${locale.stats.colMessages}</th>
              </tr>
            </thead>
            <tbody>
              ${stats.busiestDays.slice(0, 5).map((d) => `
                <tr>
                  <td>${d.date}</td>
                  <td style="text-align: right">${d.count.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${stats.topSilences.length > 0 ? `
        <div class="card section-card">
          <div class="section-card__header">
            <h2 class="section-subheading">${locale.stats.topSilencesTitle}</h2>
            <span class="section-card__subtitle text-muted text-xs">${locale.stats.silencesSubtitle}</span>
          </div>
          <table class="data-table" aria-label="Longest silences">
            <thead>
              <tr>
                <th scope="col">${locale.stats.colDuration}</th>
                <th scope="col">${locale.stats.colFrom}</th>
                <th scope="col">${locale.stats.colBrokenBy}</th>
              </tr>
            </thead>
            <tbody>
              ${stats.topSilences.map((s) => `
                <tr>
                  <td>${formatDuration(s.durationMs)}</td>
                  <td>${formatDate(s.startTs)}</td>
                  <td>${escapeHtml(s.brokenBy)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;

    // Inject share bars
    const shareBarsEl = panel.querySelector('.share-bars');
    if (shareBarsEl) {
      const sorted = [...perPerson.values()].sort((a, b) => b.messageCount - a.messageCount);
      sorted.forEach((p, i) => {
        shareBarsEl.appendChild(renderShareBar({
          label: p.name,
          value: p.messageCount,
          total: stats.totalMessages,
          color: chartColor(i),
        }, i));
      });
    }

    return panel;
  }

  // ── Per-person ────────────────────────────────────────────────────────────
  function buildPerPerson(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel container';

    const sorted = [...perPerson.values()].sort((a, b) => b.messageCount - a.messageCount);

    panel.innerHTML = `
      <div class="per-person-grid" id="per-person-grid"></div>
    `;

    const grid = panel.querySelector('#per-person-grid')!;

    sorted.forEach((p, i) => {
      const color = chartColor(i);
      const card = document.createElement('div');
      card.className = 'person-card card';
      card.style.setProperty('--person-color', color);

      card.innerHTML = `
        <div class="person-card__header">
          <div class="person-card__avatar" aria-hidden="true" style="background:${color}20;color:${color}">
            ${escapeHtml(p.name.slice(0, 1).toUpperCase())}
          </div>
          <div>
            <h3 class="person-card__name">${escapeHtml(p.name)}</h3>
            <span class="person-card__share text-muted text-sm">
              ${p.sharePercent.toFixed(1)}% of messages
            </span>
          </div>
        </div>
        <div class="person-card__stats">
          ${miniStat(locale.stats.totalMessages, p.messageCount.toLocaleString())}
          ${miniStat(locale.stats.totalWords, p.wordCount.toLocaleString())}
          ${miniStat(locale.stats.avgMessageLength, `${Math.round(p.avgMessageLength)} chars`)}
          ${miniStat(locale.stats.mediaCount, p.mediaCount.toLocaleString())}
          ${miniStat(locale.stats.linkCount, p.linkCount.toLocaleString())}
          ${miniStat(locale.stats.emojiCount, p.emojiCount.toLocaleString())}
          ${p.medianResponseMs !== null ? miniStat(locale.stats.medianResponseTime, formatDuration(p.medianResponseMs)) : ''}
        </div>

        ${renderPersonSpeedBreakdown(p.responseDistribution)}

        ${p.topEmoji.length > 0 ? `
          <div class="person-card__emoji" aria-label="Top emoji for ${escapeHtml(p.name)}">
            ${p.topEmoji.map((e) => `
              <span class="emoji-chip" title="${e.count} times">${e.emoji}<small>${e.count}</small></span>
            `).join('')}
          </div>
        ` : ''}
      `;

      grid.appendChild(card);
    });

    return panel;
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  function buildTimeline(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel container';

    // Monthly timeline line chart
    const monthlyData = [...monthlyTimeline.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        label: key,
        value,
      }));

    const lineChart = renderLineChart({ data: monthlyData, height: 200 });

    // Year-over-year table
    const yoyRows = stats.yearlyStats.map((y) => `
      <tr>
        <td>${y.year}</td>
        <td style="text-align: right">${y.messageCount.toLocaleString()}</td>
        <td style="text-align: right">${y.activedays}</td>
        <td style="text-align: right">${y.avgPerDay.toFixed(1)}</td>
      </tr>
    `).join('');

    panel.innerHTML = `
      <div class="section-block">
        <div class="section-header-row">
          <h2 class="section-subheading">Monthly messages</h2>
          <div class="section-header-actions" id="monthly-chart-controls"></div>
        </div>
        <div id="monthly-chart-mount"></div>
      </div>

      <div class="section-block">
        <h2 class="section-subheading">Calendar heatmap</h2>
        <div id="heatmap-container"></div>
        <p class="text-subtle text-xs" style="margin-top:var(--space-2)">
          ${locale.stats.heatmapSubtitle}
        </p>
      </div>

      ${stats.yearlyStats.length > 1 ? `
        <div class="section-block">
          <h2 class="section-subheading">Year over year</h2>
          <table class="data-table" aria-label="Year over year statistics">
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col" style="text-align: right">Messages</th>
                <th scope="col" style="text-align: right">Active days</th>
                <th scope="col" style="text-align: right">Per day (avg.)</th>
              </tr>
            </thead>
            <tbody>${yoyRows}</tbody>
          </table>
        </div>
      ` : ''}
    `;

    const monthlyWidget = renderChartWithTable({
      chartElement: lineChart,
      tableData: {
        headers: ['Month', 'Messages'],
        rows: monthlyData.map((d) => [d.label, d.value]),
        caption: 'Monthly message volume',
      },
      ariaLabel: 'Monthly message statistics',
      controlsMount: panel.querySelector('#monthly-chart-controls') as HTMLElement,
    });

    panel.querySelector('#monthly-chart-mount')!.appendChild(monthlyWidget);

    const heatmapEl = renderHeatmap({ data: calendarHeatmap });
    panel.querySelector('#heatmap-container')!.appendChild(heatmapEl);

    return panel;
  }

  // ── Activity ──────────────────────────────────────────────────────────────
  function buildActivity(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel container';

    // 1. Hour of day
    const hourChart = renderBarChart({
      data: stats.hourlyActivity,
      labels: Array.from({ length: 24 }, (_, i) => i % 3 === 0 ? `${i}:00` : ''),
      height: 150,
      tooltips: stats.hourlyActivity.map((count, h) => `${String(h).padStart(2, '0')}:00 – ${count.toLocaleString()} messages`),
    });

    // 2. Weekday
    const weekdayChart = renderBarChart({
      data: stats.weekdayActivity,
      labels: locale.weekdays,
      height: 150,
      showValues: true,
      tooltips: stats.weekdayActivity.map((count, d) => `${locale.weekdays[d]} – ${count.toLocaleString()} messages`),
    });

    // 3. Month of year
    const monthChart = renderBarChart({
      data: stats.monthOfYearActivity,
      labels: locale.months,
      height: 150,
      tooltips: stats.monthOfYearActivity.map((count, m) => `${locale.months[m]} – ${count.toLocaleString()} messages`),
    });

    panel.innerHTML = `
      <div class="section-block">
        <div class="section-header-row">
          <div>
            <h2 class="section-subheading">Messages by hour of day</h2>
            <p class="text-muted text-xs">Peak activity times across 24 hours</p>
          </div>
          <div class="section-header-actions" id="hour-chart-controls"></div>
        </div>
        <div id="hour-chart-mount"></div>
      </div>

      <div class="activity-grid-two-col">
        <div class="section-block card activity-card">
          <div class="section-header-row">
            <div>
              <h2 class="section-subheading">Messages by day of week</h2>
              <p class="text-muted text-xs">Weekly messaging distribution</p>
            </div>
            <div class="section-header-actions" id="weekday-chart-controls"></div>
          </div>
          <div id="weekday-chart-mount"></div>
        </div>

        <div class="section-block card activity-card">
          <div class="section-header-row">
            <div>
              <h2 class="section-subheading">Messages by month of year</h2>
              <p class="text-muted text-xs">Seasonal messaging trends</p>
            </div>
            <div class="section-header-actions" id="month-chart-controls"></div>
          </div>
          <div id="month-chart-mount"></div>
        </div>
      </div>
    `;

    const hourWidget = renderChartWithTable({
      chartElement: hourChart,
      tableData: {
        headers: ['Hour', 'Messages'],
        rows: stats.hourlyActivity.map((count, h) => [`${String(h).padStart(2, '0')}:00`, count]),
        caption: 'Messages by hour of day',
      },
      ariaLabel: 'Hourly messages breakdown',
      controlsMount: panel.querySelector('#hour-chart-controls') as HTMLElement,
    });

    const weekdayWidget = renderChartWithTable({
      chartElement: weekdayChart,
      tableData: {
        headers: ['Day of week', 'Messages'],
        rows: stats.weekdayActivity.map((count, d) => [locale.weekdays[d]!, count]),
        caption: 'Messages by day of week',
      },
      ariaLabel: 'Day of week messages breakdown',
      controlsMount: panel.querySelector('#weekday-chart-controls') as HTMLElement,
    });

    const monthWidget = renderChartWithTable({
      chartElement: monthChart,
      tableData: {
        headers: ['Month', 'Messages'],
        rows: stats.monthOfYearActivity.map((count, m) => [locale.months[m]!, count]),
        caption: 'Messages by month of year',
      },
      ariaLabel: 'Month of year messages breakdown',
      controlsMount: panel.querySelector('#month-chart-controls') as HTMLElement,
    });

    panel.querySelector('#hour-chart-mount')!.appendChild(hourWidget);
    panel.querySelector('#weekday-chart-mount')!.appendChild(weekdayWidget);
    panel.querySelector('#month-chart-mount')!.appendChild(monthWidget);

    return panel;
  }

  // ── Words ─────────────────────────────────────────────────────────────────
  function buildWords(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'panel container';

    const top = stats.wordFrequency.slice(0, 50);
    const maxCount = top[0]?.count ?? 1;

    if (top.length === 0) {
      panel.innerHTML = `<p class="text-muted">${locale.results.noData}</p>`;
      return panel;
    }

    // Horizontal ranked bars for top 30 words with show more toggle
    const barData = top.slice(0, 30);
    const rankedBars = renderHorizontalBarList({
      items: barData.map((w) => ({
        label: w.word,
        value: w.count,
        color: 'var(--color-accent)',
      })),
      initialVisible: 10,
      maxVal: maxCount,
      showRank: true,
    });

    panel.innerHTML = `
      <div class="section-block">
        <h2 class="section-subheading">Most used words</h2>
        <div class="word-cloud" id="word-cloud" aria-label="Word frequency cloud"></div>
      </div>
      <div class="section-block">
        <div class="section-header-row">
          <div>
            <h2 class="section-subheading">Word frequency ranking</h2>
            <p class="text-muted text-xs">Top words used across all messages</p>
          </div>
          <div class="section-header-actions" id="word-bar-controls"></div>
        </div>
        <div id="word-bar-mount"></div>
      </div>
    `;

    const wordBarWidget = renderChartWithTable({
      chartElement: rankedBars,
      tableData: {
        headers: ['Word', 'Frequency'],
        rows: barData.map((w) => [w.word, w.count]),
        caption: 'Top 30 most frequent words',
      },
      ariaLabel: 'Word frequency table',
      controlsMount: panel.querySelector('#word-bar-controls') as HTMLElement,
    });

    // Word cloud (size-weighted with vibrant colors & clean word-only labels)
    const WORD_COLORS = [
      '#0E6B4E', '#2B6CB0', '#C05621', '#6B46C1',
      '#B7791F', '#D53F8C', '#2C7A7B', '#9B2C2C',
      '#3182CE', '#805AD5', '#38A169', '#DD6B20',
    ];

    const cloud = panel.querySelector('#word-cloud')!;
    top.slice(0, 45).forEach((w, idx) => {
      const size = 0.85 + (w.count / maxCount) * 0.55;
      const color = WORD_COLORS[idx % WORD_COLORS.length]!;
      const span = document.createElement('span');
      span.className = 'word-tag';
      span.textContent = w.word;
      span.style.fontSize = `${size.toFixed(2)}rem`;
      span.style.setProperty('--tag-color', color);
      span.style.setProperty('--tag-bg', `${color}14`);
      span.style.setProperty('--tag-border', `${color}38`);
      span.setAttribute('title', `${w.word}: used ${w.count.toLocaleString()} times`);
      span.setAttribute('aria-label', `${w.word}, used ${w.count.toLocaleString()} times`);
      span.setAttribute('tabindex', '0');
      cloud.appendChild(span);
    });

    panel.querySelector('#word-bar-mount')!.appendChild(wordBarWidget);

    return panel;
  }

  // ── Keyboard Shortcuts Modal ─────────────────────────────────────────────
  let lastActiveElement: HTMLElement | null = null;

  function toggleShortcutsModal(): void {
    const existing = document.querySelector('#shortcuts-modal');
    if (existing) {
      closeShortcutsModal();
      return;
    }

    lastActiveElement = document.activeElement as HTMLElement | null;

    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal-backdrop';
    modal.id = 'shortcuts-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'shortcuts-title');

    modal.innerHTML = `
      <div class="shortcuts-modal card">
        <div class="shortcuts-modal__header">
          <h3 id="shortcuts-title" class="font-semibold text-base">${locale.stats.shortcutsModalTitle}</h3>
          <button class="shortcuts-modal__close" type="button" aria-label="${locale.stats.shortcutClose}">×</button>
        </div>
        <div class="shortcuts-modal__list">
          <div class="shortcut-item"><kbd>1</kbd><span>${locale.stats.shortcutOverview}</span></div>
          <div class="shortcut-item"><kbd>2</kbd><span>${locale.stats.shortcutPerPerson}</span></div>
          <div class="shortcut-item"><kbd>3</kbd><span>${locale.stats.shortcutCompare}</span></div>
          <div class="shortcut-item"><kbd>4</kbd><span>${locale.stats.shortcutTimeline}</span></div>
          <div class="shortcut-item"><kbd>5</kbd><span>${locale.stats.shortcutActivity}</span></div>
          <div class="shortcut-item"><kbd>6</kbd><span>${locale.stats.shortcutWords}</span></div>
          <div class="shortcut-item"><kbd>→</kbd> / <kbd>←</kbd><span>${locale.stats.shortcutPrevNext}</span></div>
          <div class="shortcut-item"><kbd>t</kbd><span>${locale.stats.shortcutToggle}</span></div>
          <div class="shortcut-item"><kbd>?</kbd><span>${locale.stats.shortcutHelp}</span></div>
          <div class="shortcut-item"><kbd>Esc</kbd><span>${locale.stats.shortcutClose}</span></div>
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector<HTMLButtonElement>('.shortcuts-modal__close')!;
    closeBtn.addEventListener('click', closeShortcutsModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShortcutsModal();
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusables = modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.body.appendChild(modal);
    closeBtn.focus();
  }

  function closeShortcutsModal(): void {
    const modal = document.querySelector('#shortcuts-modal');
    if (modal) {
      modal.remove();
      lastActiveElement?.focus();
    }
  }

  return page;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statCard(
  label: string,
  value: string,
  icon: string,
  variant: 'hero' | 'compact' = 'compact',
  context?: string,
  sparkline?: string,
): string {
  const cls = variant === 'hero' ? 'card stat-hero-card' : 'card stat-compact-card';
  return `
    <div class="${cls}">
      <div class="stat-card__top">
        <div class="stat-icon" aria-hidden="true">${icon}</div>
        ${sparkline ? `<div class="stat-sparkline">${sparkline}</div>` : ''}
      </div>
      <div class="stat-number">${value}</div>
      <div class="stat-label">${label}</div>
      ${context ? `<div class="stat-context">${context}</div>` : ''}
    </div>
  `;
}

function insightCard(icon: string, text: string): string {
  return `
    <div class="insight-card">
      <div class="insight-card__icon" aria-hidden="true">${icon}</div>
      <p class="insight-card__text">${text}</p>
    </div>
  `;
}

function miniStat(label: string, value: string): string {
  const isZero = value === '0' || value.startsWith('0 ');
  const style = isZero ? 'style="opacity:0.55"' : '';
  return `
    <div class="mini-stat" ${style}>
      <span class="mini-stat__label text-muted text-xs">${label}</span>
      <span class="mini-stat__value font-semibold">${value}</span>
    </div>
  `;
}

function tabLabel(id: TabId, locale: ReturnType<typeof t>): string {
  const map: Record<TabId, string> = {
    'overview':   locale.results.overview,
    'per-person': locale.results.perPerson,
    'compare':    locale.results.compare,
    'timeline':   locale.results.timeline,
    'activity':   locale.results.activity,
    'words':      locale.results.words,
  };
  return map[id];
}

const SPEED_BUCKETS = ['< 1m', '1–5m', '5–15m', '15–60m', '1–6h', '> 6h'];

function renderPersonSpeedBreakdown(distribution: number[]): string {
  const total = distribution.reduce((sum, c) => sum + c, 0);
  if (total === 0) return '';

  return `
    <div class="person-speed-breakdown">
      <span class="text-xs text-muted font-medium">${t().stats.speedBreakdownTitle}</span>
      <div class="speed-mini-bars" aria-label="${t().stats.speedBreakdownTitle}">
        ${distribution.map((count, i) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return `
            <div class="speed-mini-row" title="${SPEED_BUCKETS[i]}: ${count} replies (${pct.toFixed(0)}%)">
              <span class="speed-mini-label text-subtle text-xs">${SPEED_BUCKETS[i]}</span>
              <div class="speed-mini-track">
                <div class="speed-mini-fill" style="width:${pct.toFixed(1)}%"></div>
              </div>
              <span class="speed-mini-count text-subtle text-xs">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
