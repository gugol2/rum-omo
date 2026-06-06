import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startCollecting } from './collector';
import type { RUMMetric } from './types';

type WebVitalsCb = (metric: any) => void;
const handlers: Record<string, WebVitalsCb> = {};

vi.mock('web-vitals', () => ({
  onLCP: vi.fn((cb: WebVitalsCb) => { handlers['LCP'] = cb; }),
  onINP: vi.fn((cb: WebVitalsCb) => { handlers['INP'] = cb; }),
  onCLS: vi.fn((cb: WebVitalsCb) => { handlers['CLS'] = cb; }),
  onFCP: vi.fn((cb: WebVitalsCb) => { handlers['FCP'] = cb; }),
  onTTFB: vi.fn((cb: WebVitalsCb) => { handlers['TTFB'] = cb; }),
}));

function makeRawMetric(name: string, overrides?: Partial<RUMMetric>) {
  return {
    name,
    value: 1200,
    rating: 'good' as const,
    delta: 1200,
    id: `v3-${name}-abc`,
    navigationType: 'navigate',
    ...overrides,
  };
}

describe('startCollecting', () => {
  beforeEach(() => {
    Object.keys(handlers).forEach((k) => delete handlers[k]);
  });

  it('registers handlers for all five metrics', () => {
    const stop = startCollecting([]);
    expect(Object.keys(handlers)).toEqual(expect.arrayContaining(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']));
    stop();
  });

  it('normalises raw web-vitals metric into RUMMetric shape', () => {
    const plugin = vi.fn();
    const stop = startCollecting([plugin]);

    handlers['LCP']!(makeRawMetric('LCP', { value: 2500 }));

    expect(plugin).toHaveBeenCalledOnce();
    const received: RUMMetric = plugin.mock.calls[0][0];
    expect(received.name).toBe('LCP');
    expect(received.value).toBe(2500);
    expect(received.rating).toBe('good');
    expect(received.delta).toBe(1200);
    expect(received.id).toBe('v3-LCP-abc');
    expect(received.navigationType).toBe('navigate');
    expect(typeof received.timestamp).toBe('number');
    stop();
  });

  it('defaults navigationType to "navigate" when absent', () => {
    const plugin = vi.fn();
    const stop = startCollecting([plugin]);

    const raw = makeRawMetric('FCP');
    delete (raw as any).navigationType;
    handlers['FCP']!(raw);

    expect(plugin.mock.calls[0][0].navigationType).toBe('navigate');
    stop();
  });

  it('dispatches to all plugins', () => {
    const p1 = vi.fn();
    const p2 = vi.fn();
    const stop = startCollecting([p1, p2]);

    handlers['CLS']!(makeRawMetric('CLS'));

    expect(p1).toHaveBeenCalledOnce();
    expect(p2).toHaveBeenCalledOnce();
    stop();
  });

  it('stop() prevents further dispatching', () => {
    const plugin = vi.fn();
    const stop = startCollecting([plugin]);

    stop();
    handlers['INP']!(makeRawMetric('INP'));

    expect(plugin).not.toHaveBeenCalled();
  });

  it('stop() is idempotent', () => {
    const stop = startCollecting([]);
    expect(() => { stop(); stop(); }).not.toThrow();
  });
});
