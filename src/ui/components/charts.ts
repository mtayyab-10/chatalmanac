/**
 * src/ui/components/charts.ts
 *
 * Pure SVG chart components.
 * No external library — everything rendered with inline SVG.
 * Each function takes data and returns an SVGElement or HTMLElement.
 */

import { escapeHtml } from '../../utils/sanitize.ts';

// ─── Color helpers ────────────────────────────────────────────────────────────

const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

export interface BarChartOptions {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  showValues?: boolean;
  /** If given, each bar gets a tooltip */
  tooltips?: string[];
}

export function renderBarChart(opts: BarChartOptions): SVGSVGElement {
  const {
    data,
    labels,
    color = 'var(--color-accent)',
    height = 180,
    showValues = false,
    tooltips,
  } = opts;

  const ns = 'http://www.w3.org/2000/svg';
  const width = Math.max(data.length * 36, 300);
  const padBottom = 32;
  const padTop = 16;
  const chartH = height - padBottom - padTop;
  const max = Math.max(...data, 1);

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Bar chart');

  // Add subtle vertical gradient defs
  const defs = document.createElementNS(ns, 'defs');
  const gradId = `bar-grad-${Math.random().toString(36).slice(2, 7)}`;
  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', gradId);
  grad.setAttribute('x1', '0');
  grad.setAttribute('y1', '0');
  grad.setAttribute('x2', '0');
  grad.setAttribute('y2', '1');
  const stop1 = document.createElementNS(ns, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', color);
  stop1.setAttribute('stop-opacity', '1');
  const stop2 = document.createElementNS(ns, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', color);
  stop2.setAttribute('stop-opacity', '0.65');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  const barW = 24;
  const barGap = (width / data.length) - barW;
  let xOffset = barGap / 2;

  for (let i = 0; i < data.length; i++) {
    const val = data[i] ?? 0;
    const barH = Math.max((val / max) * chartH, val > 0 ? 3 : 0);
    const y = padTop + chartH - barH;

    // Bar
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', String(xOffset));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('opacity', val > 0 ? '0.95' : '0.15');

    if (tooltips?.[i]) {
      const title = document.createElementNS(ns, 'title');
      title.textContent = tooltips[i]!;
      rect.appendChild(title);
    }

    svg.appendChild(rect);

    // Label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(xOffset + barW / 2));
    label.setAttribute('y', String(height - 6));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'chart-label');
    label.textContent = labels[i] ?? '';
    svg.appendChild(label);

    // Value on top (optional)
    if (showValues && val > 0) {
      const valueText = document.createElementNS(ns, 'text');
      valueText.setAttribute('x', String(xOffset + barW / 2));
      valueText.setAttribute('y', String(y - 4));
      valueText.setAttribute('text-anchor', 'middle');
      valueText.setAttribute('class', 'chart-label');
      valueText.textContent = String(val);
      svg.appendChild(valueText);
    }

    xOffset += barW + barGap;
  }

  return svg;
}

// ─── Sparkline mini-chart ───────────────────────────────────────────────────

export interface SparklineOptions {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function renderSparkline(opts: SparklineOptions): SVGSVGElement {
  const {
    data,
    width = 100,
    height = 24,
    color = 'var(--color-accent)',
  } = opts;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Sparkline');

  if (data.length < 2) return svg;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);

  const pad = 2;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const points = data.map((val, i) => {
    const x = pad + (i / (data.length - 1)) * chartW;
    const y = pad + chartH - ((val - min) / range) * chartH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', `M${points.join(' L')}`);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  return svg;
}

// ─── Line / area chart ────────────────────────────────────────────────────────

export interface LineChartOptions {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
  fill?: boolean;
}

export function renderLineChart(opts: LineChartOptions): SVGSVGElement {
  const {
    data,
    color = 'var(--color-accent)',
    height = 160,
    fill = true,
  } = opts;

  const ns = 'http://www.w3.org/2000/svg';
  const width = Math.max(data.length * 40, 400);
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 12;
  const chartH = height - padBottom - padTop;
  const chartW = width - padLeft - padRight;
  const max = Math.max(...data.map((d) => d.value), 1);

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(height));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Line chart');

  if (data.length === 0) {
    const emptyText = document.createElementNS(ns, 'text');
    emptyText.setAttribute('x', String(width / 2));
    emptyText.setAttribute('y', String(height / 2));
    emptyText.setAttribute('text-anchor', 'middle');
    emptyText.setAttribute('fill', 'var(--color-text-muted)');
    emptyText.setAttribute('font-size', '13');
    emptyText.textContent = 'No message data available';
    svg.appendChild(emptyText);
    return svg;
  }

  if (data.length === 1) {
    const d = data[0]!;
    const cx = width / 2;
    const barW = Math.min(80, chartW * 0.4);
    const barH = Math.max(30, (d.value / max) * (chartH - 24));
    const yTop = padTop + chartH - barH;

    // Baseline axis
    const baseline = document.createElementNS(ns, 'line');
    baseline.setAttribute('x1', String(padLeft));
    baseline.setAttribute('y1', String(padTop + chartH));
    baseline.setAttribute('x2', String(width - padRight));
    baseline.setAttribute('y2', String(padTop + chartH));
    baseline.setAttribute('stroke', 'var(--color-border)');
    baseline.setAttribute('stroke-width', '1');
    svg.appendChild(baseline);

    // Pillar for the single period
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', String(cx - barW / 2));
    rect.setAttribute('y', String(yTop));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '6');
    rect.setAttribute('fill', color);
    rect.setAttribute('opacity', '0.85');
    svg.appendChild(rect);

    const title = document.createElementNS(ns, 'title');
    title.textContent = `${d.label}: ${d.value.toLocaleString()} messages`;
    rect.appendChild(title);

    // Value text on top
    const valText = document.createElementNS(ns, 'text');
    valText.setAttribute('x', String(cx));
    valText.setAttribute('y', String(Math.max(padTop + 14, yTop - 8)));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('font-size', '13');
    valText.setAttribute('font-weight', 'bold');
    valText.setAttribute('fill', 'var(--color-text)');
    valText.textContent = `${d.value.toLocaleString()} msgs`;
    svg.appendChild(valText);

    // Label below baseline
    const labelText = document.createElementNS(ns, 'text');
    labelText.setAttribute('x', String(cx));
    labelText.setAttribute('y', String(height - 8));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('class', 'chart-label');
    labelText.setAttribute('font-size', '12');
    labelText.textContent = d.label;
    svg.appendChild(labelText);

    return svg;
  }

  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - (d.value / max) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  if (fill) {
    const lastPt = points[points.length - 1]!;
    const firstPt = points[0]!;
    const fillD = `${pathD} L${lastPt.x},${padTop + chartH} L${firstPt.x},${padTop + chartH} Z`;
    const fillPath = document.createElementNS(ns, 'path');
    fillPath.setAttribute('d', fillD);
    fillPath.setAttribute('fill', color);
    fillPath.setAttribute('opacity', '0.1');
    svg.appendChild(fillPath);
  }

  const linePath = document.createElementNS(ns, 'path');
  linePath.setAttribute('d', pathD);
  linePath.setAttribute('stroke', color);
  linePath.setAttribute('stroke-width', '2');
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke-linecap', 'round');
  linePath.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(linePath);

  // Dots and labels (every N-th to avoid crowding)
  const step = Math.max(1, Math.floor(data.length / 8));
  for (let i = 0; i < points.length; i += step) {
    const p = points[i]!;
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', String(p.x));
    circle.setAttribute('cy', String(p.y));
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', color);
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${p.label}: ${p.value.toLocaleString()}`;
    circle.appendChild(title);
    svg.appendChild(circle);

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', String(p.x));
    text.setAttribute('y', String(height - 6));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'chart-label');
    text.textContent = p.label;
    svg.appendChild(text);
  }

  return svg;
}

// ─── Donut / pie chart ────────────────────────────────────────────────────────

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export function renderDonut(segments: DonutSegment[], size = 160): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const innerR = size * 0.25;

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Donut chart');

  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return svg;

  let startAngle = -Math.PI / 2;

  segments.forEach((seg, i) => {
    const frac = seg.value / total;
    const sweep = frac * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);

    const large = sweep > Math.PI ? 1 : 0;

    const path = document.createElementNS(ns, 'path');
    path.setAttribute(
      'd',
      `M${ix1.toFixed(2)},${iy1.toFixed(2)} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${innerR},${innerR} 0 ${large},0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`,
    );
    path.setAttribute('fill', seg.color ?? chartColor(i));
    path.setAttribute('stroke', 'var(--color-bg)');
    path.setAttribute('stroke-width', '2');
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${seg.label}: ${(frac * 100).toFixed(1)}%`;
    path.appendChild(title);
    svg.appendChild(path);

    startAngle = endAngle;
  });

  return svg;
}

// ─── Calendar heatmap ─────────────────────────────────────────────────────────

export interface HeatmapOptions {
  /** Map of YYYY-MM-DD → count */
  data: Map<string, number>;
  /** Start date as YYYY-MM-DD (defaults to 12 months ago) */
  start?: string;
  /** End date as YYYY-MM-DD (defaults to today) */
  end?: string;
}

export function renderHeatmap(opts: HeatmapOptions): HTMLElement {
  const { data } = opts;
  const container = document.createElement('div');
  container.className = 'heatmap';

  if (data.size === 0) {
    container.textContent = 'No data';
    return container;
  }

  const maxVal = Math.max(...data.values(), 1);

  // Build 12 months ending today
  const endDate = new Date();
  endDate.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
  startDate.setUTCDate(1);

  // Group by YYYY-MM for month columns
  const months: Array<{ label: string; days: Array<{ key: string; count: number; date: Date }> }> = [];

  let current = new Date(startDate);
  while (current <= endDate) {
    const y = current.getUTCFullYear();
    const m = current.getUTCMonth();
    const label = new Date(y, m, 1).toLocaleDateString('en', { month: 'short' });

    const daysInMonth: Array<{ key: string; count: number; date: Date }> = [];
    const firstDay = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(Date.UTC(y, m + 1, 0));

    for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d > endDate) break;
      const key = d.toISOString().slice(0, 10);
      daysInMonth.push({ key, count: data.get(key) ?? 0, date: new Date(d) });
    }

    months.push({ label, days: daysInMonth });
    current = new Date(Date.UTC(y, m + 1, 1));
  }

  // Render
  const grid = document.createElement('div');
  grid.className = 'heatmap__grid';

  for (const month of months) {
    const col = document.createElement('div');
    col.className = 'heatmap__month';

    const header = document.createElement('div');
    header.className = 'heatmap__month-label';
    header.textContent = month.label;
    col.appendChild(header);

    const days = document.createElement('div');
    days.className = 'heatmap__days';

    for (const day of month.days) {
      const cell = document.createElement('div');
      cell.className = 'heatmap__day';
      const intensity = day.count > 0 ? Math.max(0.15, day.count / maxVal) : 0;
      cell.style.setProperty('--intensity', String(intensity));
      if (day.count > 0) {
        cell.setAttribute('title', `${day.key}: ${day.count} messages`);
        cell.setAttribute('aria-label', `${day.key}: ${day.count} messages`);
      }
      days.appendChild(cell);
    }

    col.appendChild(days);
    grid.appendChild(col);
  }

  container.appendChild(grid);
  return container;
}

// ─── Horizontal bar (share / percentage) ─────────────────────────────────────

export interface ShareBarItem {
  label: string;
  value: number;
  total: number;
  color?: string;
}

export function renderShareBar(item: ShareBarItem, index: number): HTMLElement {
  const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
  const color = item.color ?? chartColor(index);

  const el = document.createElement('div');
  el.className = 'share-bar';
  el.innerHTML = `
    <div class="share-bar__meta">
      <span class="share-bar__label">${escapeHtml(item.label)}</span>
      <span class="share-bar__value">${item.value.toLocaleString()}</span>
      <span class="share-bar__pct text-muted">${pct.toFixed(1)}%</span>
    </div>
    <div class="share-bar__track">
      <div class="share-bar__fill" style="width:${pct.toFixed(2)}%;background:${color}"></div>
    </div>
  `;
  return el;
}

// ─── Horizontal Ranked Bar List ───────────────────────────────────────────────

export interface HorizontalBarItem {
  label: string;
  value: number;
  sublabel?: string;
  tooltip?: string;
  color?: string;
}

export interface HorizontalBarListOptions {
  items: HorizontalBarItem[];
  initialVisible?: number;
  maxVal?: number;
  showRank?: boolean;
  valueSuffix?: string;
}

export function renderHorizontalBarList(opts: HorizontalBarListOptions): HTMLElement {
  const {
    items,
    initialVisible = 10,
    showRank = true,
    valueSuffix = '',
  } = opts;

  const container = document.createElement('div');
  container.className = 'ranked-words-container';

  if (items.length === 0) {
    container.innerHTML = '<p class="text-muted text-xs">No items to display.</p>';
    return container;
  }

  const maxVal = opts.maxVal ?? Math.max(...items.map((it) => it.value), 1);

  const list = document.createElement('div');
  list.className = 'ranked-words-list';

  items.forEach((item, index) => {
    const isExtra = index >= initialVisible;
    const pct = Math.max((item.value / maxVal) * 100, item.value > 0 ? 2 : 0);
    const color = item.color ?? 'var(--color-accent)';

    const row = document.createElement('div');
    row.className = `ranked-word-item ${isExtra ? 'ranked-word-item--extra hidden' : ''}`;
    row.title = item.tooltip || `${item.label}: ${item.value.toLocaleString()}${valueSuffix}`;

    row.innerHTML = `
      ${showRank ? `<span class="ranked-word-rank">#${index + 1}</span>` : ''}
      <span class="ranked-word-text" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
      <div class="ranked-word-bar-track" role="progressbar" aria-valuenow="${item.value}" aria-valuemax="${maxVal}">
        <div class="ranked-word-bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div>
      </div>
      <span class="ranked-word-count">${item.value.toLocaleString()}${valueSuffix}</span>
    `;

    list.appendChild(row);
  });

  container.appendChild(list);

  if (items.length > initialVisible) {
    const moreWrap = document.createElement('div');
    moreWrap.className = 'ranked-word-more-wrap';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn--secondary btn--sm ranked-word-toggle-btn';
    toggleBtn.innerHTML = `
      <span class="toggle-text">Show more (top ${items.length})</span>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="toggle-chevron" aria-hidden="true">
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    let expanded = false;
    toggleBtn.addEventListener('click', () => {
      expanded = !expanded;
      const extras = list.querySelectorAll('.ranked-word-item--extra');
      extras.forEach((el) => el.classList.toggle('hidden', !expanded));

      const textEl = toggleBtn.querySelector('.toggle-text');
      const chevron = toggleBtn.querySelector('.toggle-chevron');
      if (textEl) {
        textEl.textContent = expanded ? 'Show less' : `Show more (top ${items.length})`;
      }
      if (chevron) {
        chevron.classList.toggle('is-expanded', expanded);
      }
    });

    moreWrap.appendChild(toggleBtn);
    container.appendChild(moreWrap);
  }

  return container;
}


// ─── Chart with Accessible Table View ─────────────────────────────────────────

export interface ChartWithTableOptions {
  chartElement: HTMLElement | SVGElement;
  tableData: {
    headers: [string, string];
    rows: Array<[string, number | string]>;
    caption?: string;
  };
  ariaLabel?: string;
  initialMode?: 'chart' | 'table';
  controlsMount?: HTMLElement;
}

export function renderChartWithTable(opts: ChartWithTableOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'chart-with-table';

  const controls = document.createElement('div');
  controls.className = 'chart-with-table__controls';
  controls.innerHTML = `
    <div class="view-toggle" role="group" aria-label="Display format">
      <button class="view-toggle__btn active" type="button" data-mode="chart" aria-pressed="true">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 13V8m4 5V3m4 10V6m4 7V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        Chart
      </button>
      <button class="view-toggle__btn" type="button" data-mode="table" aria-pressed="false">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M2 7h12M6 7v6" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        Table
      </button>
    </div>
  `;

  const chartView = document.createElement('div');
  chartView.className = 'chart-view';
  chartView.appendChild(opts.chartElement);

  const tableView = document.createElement('div');
  tableView.className = 'table-view hidden';
  tableView.innerHTML = `
    <table class="data-table" aria-label="${escapeHtml(opts.ariaLabel || opts.tableData.caption || 'Data table')}">
      ${opts.tableData.caption ? `<caption class="sr-only">${escapeHtml(opts.tableData.caption)}</caption>` : ''}
      <thead>
        <tr>
          <th scope="col">${escapeHtml(opts.tableData.headers[0])}</th>
          <th scope="col" style="text-align: right">${escapeHtml(opts.tableData.headers[1])}</th>
        </tr>
      </thead>
      <tbody>
        ${opts.tableData.rows.map(([label, val]) => `
          <tr>
            <td>${escapeHtml(String(label))}</td>
            <td style="text-align: right">${typeof val === 'number' ? val.toLocaleString() : escapeHtml(String(val))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  function setMode(mode: 'chart' | 'table'): void {
    controls.querySelectorAll<HTMLButtonElement>('.view-toggle__btn').forEach((b) => {
      const isSelected = b.dataset['mode'] === mode;
      b.classList.toggle('active', isSelected);
      b.setAttribute('aria-pressed', String(isSelected));
    });
    if (mode === 'chart') {
      chartView.classList.remove('hidden');
      tableView.classList.add('hidden');
    } else {
      chartView.classList.add('hidden');
      tableView.classList.remove('hidden');
    }
  }

  controls.querySelectorAll<HTMLButtonElement>('.view-toggle__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset['mode'] as 'chart' | 'table';
      setMode(mode);
    });
  });

  if (opts.initialMode === 'table') {
    setMode('table');
  }

  if (opts.controlsMount) {
    opts.controlsMount.appendChild(controls);
  } else {
    container.appendChild(controls);
  }
  container.appendChild(chartView);
  container.appendChild(tableView);

  (container as unknown as { toggleView: () => void }).toggleView = () => {
    const isChart = !chartView.classList.contains('hidden');
    setMode(isChart ? 'table' : 'chart');
  };

  return container;
}
