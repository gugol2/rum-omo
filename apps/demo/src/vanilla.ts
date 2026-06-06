import type { RUMMetric } from '@rum-omo/core';
import { createRUM, localStoragePlugin } from '@rum-omo/core';

const RATING_COLOR: Record<string, string> = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
};

const THRESHOLDS: Record<string, string> = {
  LCP: '≤ 2500ms',
  INP: '≤ 200ms',
  CLS: '≤ 0.1',
  FCP: '≤ 1800ms',
  TTFB: '≤ 800ms',
};

function formatValue(name: string, value: number): string {
  return name === 'CLS' ? value.toFixed(4) : `${Math.round(value)}ms`;
}

// ─── DOM refs ────────────────────────────────────────────────────────────────

const tbody = document.getElementById(
  'metrics-body',
) as HTMLTableSectionElement;
const countEl = document.getElementById('event-count') as HTMLSpanElement;
const emptyEl = document.getElementById('empty-state') as HTMLParagraphElement;
const tableEl = document.getElementById('metrics-table') as HTMLTableElement;

// ─── Metric state (dedup by name) ────────────────────────────────────────────

const latest = new Map<string, RUMMetric>();

function renderMetrics(): void {
  const rows = Array.from(latest.values());
  countEl.textContent = `${rows.length} event${rows.length !== 1 ? 's' : ''}`;

  if (rows.length === 0) {
    emptyEl.style.display = 'block';
    tableEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  tableEl.style.display = 'table';
  tbody.innerHTML = '';

  for (const m of rows) {
    const color = RATING_COLOR[m.rating] ?? '#999';
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #f1f5f9';
    tr.innerHTML = `
      <td style="padding:11px 12px;font-weight:600">${m.name}</td>
      <td style="padding:11px 12px;font-family:monospace">${formatValue(m.name, m.value)}</td>
      <td style="padding:11px 12px">
        <span style="color:${color};background:${color}22;padding:2px 10px;border-radius:999px;font-size:0.78rem;font-weight:600">
          ${m.rating}
        </span>
      </td>
      <td style="padding:11px 12px;font-family:monospace;color:#94a3b8">${formatValue(m.name, m.delta)}</td>
      <td style="padding:11px 12px;color:#cbd5e1;font-size:0.8rem">${THRESHOLDS[m.name] ?? ''}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ─── RUM setup ───────────────────────────────────────────────────────────────

const rum = createRUM({
  debug: true,
  plugins: [
    localStoragePlugin({ key: 'rum_vanilla_demo' }),
    (metric) => {
      latest.set(metric.name, metric);
      renderMetrics();
    },
  ],
});

rum.start();

// ─── Triggers ────────────────────────────────────────────────────────────────

document.getElementById('btn-inp')!.addEventListener('click', () => {
  const end = Date.now() + 300;
  while (Date.now() < end) {}
});

let clsTimeout: ReturnType<typeof setTimeout> | null = null;
document.getElementById('btn-cls')!.addEventListener('click', () => {
  const banner = document.getElementById('cls-banner')!;
  banner.style.display = 'block';
  if (clsTimeout) clearTimeout(clsTimeout);
  clsTimeout = setTimeout(() => {
    banner.style.display = 'none';
  }, 2500);
});

// initial render
renderMetrics();
