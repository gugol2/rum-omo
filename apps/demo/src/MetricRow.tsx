import type { RUMMetric } from '@rum-omo/core';

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

export function MetricRow({ metric: m }: { metric: RUMMetric }) {
  const color = RATING_COLOR[m.rating] ?? '#999';
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '11px 12px', fontWeight: 600 }}>{m.name}</td>
      <td style={{ padding: '11px 12px', fontFamily: 'monospace' }}>
        {formatValue(m.name, m.value)}
      </td>
      <td style={{ padding: '11px 12px' }}>
        <span
          style={{
            color,
            background: color + '22',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
          }}
        >
          {m.rating}
        </span>
      </td>
      <td
        style={{
          padding: '11px 12px',
          fontFamily: 'monospace',
          color: '#94a3b8',
        }}
      >
        {formatValue(m.name, m.delta)}
      </td>
      <td
        style={{ padding: '11px 12px', color: '#cbd5e1', fontSize: '0.8rem' }}
      >
        {THRESHOLDS[m.name]}
      </td>
    </tr>
  );
}
