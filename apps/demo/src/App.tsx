import type { RUMMetric } from '@rum-omo/core';
import { useRUM } from '@rum-omo/react';
import React, { useState } from 'react';

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

// web-vitals fires the same metric multiple times with the same id as values update
// (INP tracks worst interaction, CLS accumulates, LCP updates to largest element).
// For display we deduplicate by name and show the latest value.
function dedup(metrics: RUMMetric[]): RUMMetric[] {
  const map = new Map<string, RUMMetric>();
  for (const m of metrics) map.set(m.name, m);
  return Array.from(map.values());
}

export default function App() {
  const { metrics: allMetrics } = useRUM();
  const metrics = dedup(allMetrics);
  const [clsBanner, setClsBanner] = useState(false);

  function triggerSlowINP() {
    // Block the main thread to produce a measurable INP
    const end = Date.now() + 300;
    while (Date.now() < end) {}
  }

  function triggerCLS() {
    setClsBanner(true);
    setTimeout(() => setClsBanner(false), 2500);
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 820, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {clsBanner && (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 6, padding: '10px 16px', marginTop: '1rem', fontSize: '0.875rem' }}>
          Layout shift injected — watch the CLS metric update
        </div>
      )}

      <header style={{ padding: '3.5rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          rum-omo
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1.05rem' }}>
          Real User Monitoring — Core Web Vitals collected live from this tab
        </p>
      </header>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={sectionHeading}>Triggers</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={triggerSlowINP} style={btn}>
            Slow INP <span style={{ color: '#94a3b8', fontWeight: 400 }}>(300ms block)</span>
          </button>
          <button onClick={triggerCLS} style={btn}>
            Trigger CLS <span style={{ color: '#94a3b8', fontWeight: 400 }}>(layout shift)</span>
          </button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.75rem' }}>
          LCP, FCP, and TTFB fire automatically on load. INP fires after you interact with the page.
        </p>
      </section>

      <section>
        <h2 style={sectionHeading}>
          Collected metrics
          {metrics.length > 0 && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8' }}>
              {metrics.length} event{metrics.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>

        {metrics.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '2rem 0', fontSize: '0.9rem' }}>
            Waiting for metrics… interact with the page or just wait a moment.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Metric', 'Value', 'Rating', 'Delta', 'Good threshold'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <MetricRow key={m.name} metric={m} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function MetricRow({ metric: m }: { metric: RUMMetric }) {
  const color = RATING_COLOR[m.rating] ?? '#999';
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '11px 12px', fontWeight: 600 }}>{m.name}</td>
      <td style={{ padding: '11px 12px', fontFamily: 'monospace' }}>
        {formatValue(m.name, m.value)}
      </td>
      <td style={{ padding: '11px 12px' }}>
        <span style={{
          color,
          background: color + '22',
          padding: '2px 10px',
          borderRadius: 999,
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}>
          {m.rating}
        </span>
      </td>
      <td style={{ padding: '11px 12px', fontFamily: 'monospace', color: '#94a3b8' }}>
        {formatValue(m.name, m.delta)}
      </td>
      <td style={{ padding: '11px 12px', color: '#cbd5e1', fontSize: '0.8rem' }}>
        {THRESHOLDS[m.name]}
      </td>
    </tr>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '1rem',
};

const btn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 7,
  border: '1px solid #e2e8f0',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};
