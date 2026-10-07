/**
 * src/ui/components/compare.ts
 *
 * Dedicated head-to-head comparison component for Phase 6.
 * Compares two participants side-by-side with visual comparison bars,
 * response time metrics, top emojis, and conversation habits.
 */

import type { SerializedStats } from '../../worker/analyzer.worker.ts';
import { chartColor } from './charts.ts';
import { t } from '../../locales/index.ts';
import { escapeHtml } from '../../utils/sanitize.ts';

export function renderCompare(stats: SerializedStats): HTMLElement {
  const container = document.createElement('div');
  container.className = 'compare-panel container animate-fade-in-fast';

  const locale = t();

  if (stats.participants.length < 2) {
    container.innerHTML = `
      <div class="card compare-empty">
        <p class="text-muted">${locale.stats.compareNeedTwo}</p>
      </div>
    `;
    return container;
  }

  type MetricCategory = 'all' | 'core' | 'habits';

  // Pre-select top two senders
  const sortedPeople = [...stats.perPerson].sort((a, b) => b[1].messageCount - a[1].messageCount);
  let personAIndex = 0;
  let personBIndex = sortedPeople.length > 1 ? 1 : 0;
  let activeFilter: MetricCategory = 'core';

  function render(): void {
    const personA = sortedPeople[personAIndex]![1];
    const personB = sortedPeople[personBIndex]![1];

    const colorA = chartColor(personAIndex);
    const colorB = chartColor(personBIndex);

    // Starters and enders maps
    const startersMap = new Map(stats.conversationStarters);
    const endersMap = new Map(stats.conversationEnders);

    const startersA = startersMap.get(personA.name) ?? 0;
    const startersB = startersMap.get(personB.name) ?? 0;

    const endersA = endersMap.get(personA.name) ?? 0;
    const endersB = endersMap.get(personB.name) ?? 0;

    // Response time
    const medianMinA = personA.medianResponseMs !== null ? personA.medianResponseMs / 60_000 : null;
    const medianMinB = personB.medianResponseMs !== null ? personB.medianResponseMs / 60_000 : null;

    // Winner highlights with color coding
    const highlightItems: Array<{ text: string; color: string; icon: string }> = [];

    if (personA.messageCount > personB.messageCount) {
      const ratio = (personA.messageCount / Math.max(1, personB.messageCount)).toFixed(1);
      highlightItems.push({
        text: `<strong>${escapeHtml(personA.name)}</strong> sent ${ratio}x more messages`,
        color: colorA,
        icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
      });
    } else if (personB.messageCount > personA.messageCount) {
      const ratio = (personB.messageCount / Math.max(1, personA.messageCount)).toFixed(1);
      highlightItems.push({
        text: `<strong>${escapeHtml(personB.name)}</strong> sent ${ratio}x more messages`,
        color: colorB,
        icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>',
      });
    }

    if (medianMinA !== null && medianMinB !== null && medianMinA !== medianMinB) {
      const fasterIsA = medianMinA < medianMinB;
      const faster = fasterIsA ? personA.name : personB.name;
      const winnerColor = fasterIsA ? colorA : colorB;
      const fMin = Math.min(medianMinA, medianMinB).toFixed(1);
      const sMin = Math.max(medianMinA, medianMinB).toFixed(1);
      highlightItems.push({
        text: `<strong>${escapeHtml(faster)}</strong> replies faster (${fMin} min vs ${sMin} min)`,
        color: winnerColor,
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>',
      });
    }

    if (Math.round(personA.avgMessageLength) !== Math.round(personB.avgMessageLength)) {
      const longerIsA = personA.avgMessageLength > personB.avgMessageLength;
      const longer = longerIsA ? personA.name : personB.name;
      const winnerColor = longerIsA ? colorA : colorB;
      highlightItems.push({
        text: `<strong>${escapeHtml(longer)}</strong> writes longer messages on average`,
        color: winnerColor,
        icon: '<path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      });
    }

    if (startersA !== startersB) {
      const starterIsA = startersA > startersB;
      const moreStarters = starterIsA ? personA.name : personB.name;
      const winnerColor = starterIsA ? colorA : colorB;
      highlightItems.push({
        text: `<strong>${escapeHtml(moreStarters)}</strong> initiates more conversations`,
        color: winnerColor,
        icon: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill="currentColor"/>',
      });
    }

    const leaderBadgeA = personA.messageCount > personB.messageCount
      ? `<span class="compare-lead-badge" style="background:${colorA}20;color:${colorA}">🏆 Lead</span>`
      : '';
    const leaderBadgeB = personB.messageCount > personA.messageCount
      ? `<span class="compare-lead-badge" style="background:${colorB}20;color:${colorB}">🏆 Lead</span>`
      : '';

    const metrics: Array<{
      label: string;
      valA: number | string;
      valB: number | string;
      category: 'core' | 'habits';
      unit?: string;
      lowerIsBetter?: boolean;
    }> = [
      { label: 'Messages sent', valA: personA.messageCount, valB: personB.messageCount, category: 'core' },
      { label: 'Words sent', valA: personA.wordCount, valB: personB.wordCount, category: 'core' },
      { label: 'Avg. characters / msg', valA: Math.round(personA.avgMessageLength), valB: Math.round(personB.avgMessageLength), category: 'core' },
      {
        label: 'Median reply time',
        valA: medianMinA !== null ? Number(medianMinA.toFixed(1)) : 'n/a',
        valB: medianMinB !== null ? Number(medianMinB.toFixed(1)) : 'n/a',
        unit: 'min',
        lowerIsBetter: true,
        category: 'core',
      },
      { label: 'Questions asked', valA: personA.questionCount, valB: personB.questionCount, category: 'core' },
      { label: 'Emoji used', valA: personA.emojiCount, valB: personB.emojiCount, category: 'core' },
      { label: 'Media files', valA: personA.mediaCount, valB: personB.mediaCount, category: 'habits' },
      { label: 'Links shared', valA: personA.linkCount, valB: personB.linkCount, category: 'habits' },
      { label: 'Discussions started', valA: startersA, valB: startersB, category: 'habits' },
      { label: 'Last messages sent', valA: endersA, valB: endersB, category: 'habits' },
    ];

    let winsA = 0;
    let winsB = 0;
    for (const m of metrics) {
      if (typeof m.valA === 'number' && typeof m.valB === 'number') {
        if (m.lowerIsBetter) {
          if (m.valA > 0 && m.valB > 0) {
            if (m.valA < m.valB) winsA++;
            else if (m.valB < m.valA) winsB++;
          } else if (m.valA > 0) winsA++;
          else if (m.valB > 0) winsB++;
        } else {
          if (m.valA > m.valB) winsA++;
          else if (m.valB > m.valA) winsB++;
        }
      } else if (typeof m.valA === 'number') {
        winsA++;
      } else if (typeof m.valB === 'number') {
        winsB++;
      }
    }

    const displayedMetrics = metrics.filter((m) => activeFilter === 'all' || m.category === activeFilter);

    container.innerHTML = `
      <div class="compare-header">
        <div>
          <h2 class="section-subheading">${locale.stats.compareTitle}</h2>
          <p class="text-muted text-xs">${locale.stats.compareSubtitle}</p>
        </div>
      </div>

      <!-- Modern Unified Matchup Card -->
      <div class="compare-duel-card card">
        <!-- Participant A -->
        <div class="compare-duel-side" style="--participant-color: ${colorA}">
          <div class="compare-duel-avatar" style="background:${colorA}20;color:${colorA}">
            ${escapeHtml(personA.name.slice(0, 1).toUpperCase())}
          </div>
          <div class="compare-duel-info">
            <div class="compare-duel-label-row">
              <label for="select-person-a" class="compare-duel-label text-muted text-xs">${locale.stats.selectPersonA}</label>
              ${leaderBadgeA}
            </div>
            <div class="compare-duel-select-wrap">
              <select id="select-person-a" class="compare-duel-select" aria-label="${locale.stats.selectPersonA}">
                ${sortedPeople.map(([, p], idx) => `
                  <option value="${idx}" ${idx === personAIndex ? 'selected' : ''} ${idx === personBIndex ? 'disabled' : ''}>${escapeHtml(p.name)}</option>
                `).join('')}
              </select>
              <svg class="compare-duel-chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="compare-duel-stats">
              <span class="compare-duel-share" style="color:${colorA}">${personA.sharePercent.toFixed(1)}%</span>
              <span class="text-muted text-xs">of chat · ${personA.messageCount.toLocaleString()} msgs</span>
            </div>
          </div>
        </div>

        <!-- Center Matchup Connector -->
        <div class="compare-duel-vs-wrap">
          <div class="compare-duel-vs-circle" aria-hidden="true">
            <span>VS</span>
          </div>
        </div>

        <!-- Participant B -->
        <div class="compare-duel-side compare-duel-side--right" style="--participant-color: ${colorB}">
          <div class="compare-duel-avatar" style="background:${colorB}20;color:${colorB}">
            ${escapeHtml(personB.name.slice(0, 1).toUpperCase())}
          </div>
          <div class="compare-duel-info">
            <div class="compare-duel-label-row">
              <label for="select-person-b" class="compare-duel-label text-muted text-xs">${locale.stats.selectPersonB}</label>
              ${leaderBadgeB}
            </div>
            <div class="compare-duel-select-wrap">
              <select id="select-person-b" class="compare-duel-select" aria-label="${locale.stats.selectPersonB}">
                ${sortedPeople.map(([, p], idx) => `
                  <option value="${idx}" ${idx === personBIndex ? 'selected' : ''} ${idx === personAIndex ? 'disabled' : ''}>${escapeHtml(p.name)}</option>
                `).join('')}
              </select>
              <svg class="compare-duel-chevron" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="compare-duel-stats">
              <span class="compare-duel-share" style="color:${colorB}">${personB.sharePercent.toFixed(1)}%</span>
              <span class="text-muted text-xs">of chat · ${personB.messageCount.toLocaleString()} msgs</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Matchup Highlights Grid -->
      ${highlightItems.length > 0 ? `
        <div class="compare-highlights-grid">
          ${highlightItems.map((h) => `
            <div class="compare-highlight-card" style="border-inline-start: 3px solid ${h.color}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="highlight-star-icon" style="color:${h.color}" aria-hidden="true">
                ${h.icon}
              </svg>
              <span class="compare-highlight-text">${h.text}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Metric Comparison Bars (Bilateral Dual-Track) -->
      <div class="card compare-metrics-card">
        <div class="compare-metrics-header">
          <div class="compare-metrics-participant compare-metrics-participant--a">
            <span class="compare-metrics-dot" style="background:${colorA}"></span>
            <span class="compare-metrics-pname" style="color:${colorA}">${escapeHtml(personA.name)}</span>
            <span class="compare-metrics-wins" style="background:${colorA}20;color:${colorA}">${winsA} leads</span>
          </div>
          <div class="compare-metrics-title-wrap">
            <h3 class="compare-section-title">Metrics breakdown</h3>
          </div>
          <div class="compare-metrics-participant compare-metrics-participant--b">
            <span class="compare-metrics-wins" style="background:${colorB}20;color:${colorB}">${winsB} leads</span>
            <span class="compare-metrics-pname" style="color:${colorB}">${escapeHtml(personB.name)}</span>
            <span class="compare-metrics-dot" style="background:${colorB}"></span>
          </div>
        </div>

        <!-- Filter Segment Controls -->
        <div class="compare-filter-tabs" role="tablist" aria-label="Metric views">
          <button type="button" class="compare-filter-btn ${activeFilter === 'core' ? 'active' : ''}" data-filter="core">
            Key Highlights (6)
          </button>
          <button type="button" class="compare-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
            All Metrics (10)
          </button>
          <button type="button" class="compare-filter-btn ${activeFilter === 'habits' ? 'active' : ''}" data-filter="habits">
            Media & Starters (4)
          </button>
        </div>

        <div class="compare-metrics-list">
          ${displayedMetrics.map((m) => renderMetricRow(m, colorA, colorB, personA.name, personB.name)).join('')}
        </div>
      </div>

      <!-- Response Speed Breakdown -->
      <div class="card compare-metrics-card">
        <h3 class="compare-section-title">${locale.stats.responseDistributionTitle}</h3>
        <p class="text-muted text-xs" style="margin-bottom:var(--space-4)">${locale.stats.speedDistributionSubtitle}</p>
        <div class="compare-speed-grid">
          <div class="compare-speed-col">
            <h4 class="text-sm font-semibold" style="color:${colorA}">${escapeHtml(personA.name)}</h4>
            ${renderSpeedBuckets(personA.responseDistribution)}
          </div>
          <div class="compare-speed-col">
            <h4 class="text-sm font-semibold" style="color:${colorB}">${escapeHtml(personB.name)}</h4>
            ${renderSpeedBuckets(personB.responseDistribution)}
          </div>
        </div>
      </div>

      <!-- Top Emojis Comparison -->
      <div class="card compare-metrics-card">
        <h3 class="compare-section-title">Favorite emoji</h3>
        <div class="compare-emoji-grid">
          <div class="compare-emoji-col">
            <h4 class="text-sm font-semibold" style="color:${colorA}">${escapeHtml(personA.name)}</h4>
            <div class="compare-emoji-list">
              ${personA.topEmoji.slice(0, 5).map((e) => `
                <span class="emoji-chip" title="${e.count} times">${e.emoji} <small>${e.count}</small></span>
              `).join('') || `<span class="text-muted text-xs">${locale.stats.noEmoji}</span>`}
            </div>
          </div>
          <div class="compare-emoji-col">
            <h4 class="text-sm font-semibold" style="color:${colorB}">${escapeHtml(personB.name)}</h4>
            <div class="compare-emoji-list">
              ${personB.topEmoji.slice(0, 5).map((e) => `
                <span class="emoji-chip" title="${e.count} times">${e.emoji} <small>${e.count}</small></span>
              `).join('') || `<span class="text-muted text-xs">${locale.stats.noEmoji}</span>`}
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind filter segment tabs
    container.querySelectorAll<HTMLButtonElement>('.compare-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset['filter'] as 'all' | 'core' | 'habits';
        if (filter && filter !== activeFilter) {
          activeFilter = filter;
          render();
        }
      });
    });

    // Bind dropdown events with self-selection prevention
    const selectA = container.querySelector<HTMLSelectElement>('#select-person-a');
    const selectB = container.querySelector<HTMLSelectElement>('#select-person-b');

    selectA?.addEventListener('change', () => {
      personAIndex = Number(selectA.value);
      if (personAIndex === personBIndex) {
        personBIndex = (personAIndex + 1) % sortedPeople.length;
      }
      render();
    });

    selectB?.addEventListener('change', () => {
      personBIndex = Number(selectB.value);
      if (personBIndex === personAIndex) {
        personAIndex = (personBIndex + 1) % sortedPeople.length;
      }
      render();
    });
  }

  render();
  return container;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderMetricRow(
  m: { label: string; valA: number | string; valB: number | string; unit?: string; lowerIsBetter?: boolean },
  colorA: string,
  colorB: string,
  nameA: string,
  nameB: string
): string {
  const isNumA = typeof m.valA === 'number';
  const isNumB = typeof m.valB === 'number';
  const numA: number = typeof m.valA === 'number' ? m.valA : 0;
  const numB: number = typeof m.valB === 'number' ? m.valB : 0;

  let winner: 'A' | 'B' | 'tie' = 'tie';
  let barA = 0;
  let barB = 0;

  if (isNumA && isNumB) {
    if (m.lowerIsBetter) {
      if (numA > 0 && numB > 0) {
        if (numA < numB) winner = 'A';
        else if (numB < numA) winner = 'B';
        else winner = 'tie';

        const minVal = Math.min(numA, numB);
        barA = Math.round((minVal / numA) * 100);
        barB = Math.round((minVal / numB) * 100);
      } else if (numA > 0) {
        winner = 'A';
        barA = 100;
        barB = 0;
      } else if (numB > 0) {
        winner = 'B';
        barA = 0;
        barB = 100;
      }
    } else {
      if (numA > numB) winner = 'A';
      else if (numB > numA) winner = 'B';
      else winner = 'tie';

      const maxVal = Math.max(numA, numB);
      if (maxVal > 0) {
        barA = Math.round((numA / maxVal) * 100);
        barB = Math.round((numB / maxVal) * 100);
      }
    }
  } else if (isNumA && !isNumB) {
    winner = 'A';
    barA = 100;
    barB = 0;
  } else if (!isNumA && isNumB) {
    winner = 'B';
    barA = 0;
    barB = 100;
  }

  // Ensure slight minimum width if positive so small counts (e.g. 1) are visibly registered
  if (numA > 0) barA = Math.max(barA, 5);
  if (numB > 0) barB = Math.max(barB, 5);

  const strA = isNumA ? (m.unit ? `${numA.toLocaleString()} ${m.unit}` : numA.toLocaleString()) : String(m.valA);
  const strB = isNumB ? (m.unit ? `${numB.toLocaleString()} ${m.unit}` : numB.toLocaleString()) : String(m.valB);

  const tooltip = `${m.label}: ${escapeHtml(nameA)} (${strA}) vs ${escapeHtml(nameB)} (${strB})`;

  return `
    <div class="compare-row ${winner !== 'tie' ? (winner === 'A' ? 'compare-row--lead-a' : 'compare-row--lead-b') : ''}" title="${tooltip}">
      <!-- Person A Value -->
      <div class="compare-val compare-val--a ${winner === 'A' ? 'compare-val--winner' : ''}">
        <span class="compare-val-number" style="${winner === 'A' ? `color:${colorA}` : ''}">${strA}</span>
      </div>

      <!-- Left Track: bar extends outward towards left from center -->
      <div class="compare-track compare-track--left" role="progressbar" aria-valuenow="${barA}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(nameA)} ${m.label}">
        <div class="compare-bar-fill compare-bar-fill--left" style="width:${barA}%;background:${colorA}"></div>
      </div>

      <!-- Center Metric Label -->
      <div class="compare-label-wrap">
        <span class="compare-label">${escapeHtml(m.label)}</span>
      </div>

      <!-- Right Track: bar extends outward towards right from center -->
      <div class="compare-track compare-track--right" role="progressbar" aria-valuenow="${barB}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(nameB)} ${m.label}">
        <div class="compare-bar-fill compare-bar-fill--right" style="width:${barB}%;background:${colorB}"></div>
      </div>

      <!-- Person B Value -->
      <div class="compare-val compare-val--b ${winner === 'B' ? 'compare-val--winner' : ''}">
        <span class="compare-val-number" style="${winner === 'B' ? `color:${colorB}` : ''}">${strB}</span>
      </div>
    </div>
  `;
}

const BUCKET_LABELS = ['< 1 min', '1–5 min', '5–15 min', '15–60 min', '1–6 hr', '> 6 hr'];

function renderSpeedBuckets(distribution: number[]): string {
  const total = distribution.reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return '<p class="text-muted text-xs">Not enough direct replies to compute speed distribution.</p>';
  }

  return `
    <div class="speed-buckets-list">
      ${distribution.map((count, i) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return `
          <div class="speed-bucket-row">
            <span class="speed-bucket-label text-xs text-muted">${BUCKET_LABELS[i]}</span>
            <div class="speed-bucket-track">
              <div class="speed-bucket-fill" style="width:${pct.toFixed(1)}%"></div>
            </div>
            <span class="speed-bucket-count text-xs">${count.toLocaleString()}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
