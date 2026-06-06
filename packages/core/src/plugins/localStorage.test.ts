import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RUMMetric } from '../types';
import { localStoragePlugin } from './localStorage';

function makeMetric(name = 'LCP', value = 1000): RUMMetric {
  return {
    name: name as RUMMetric['name'],
    value,
    rating: 'good',
    delta: value,
    id: `v3-${name}-${value}`,
    navigationType: 'navigate',
    timestamp: Date.now(),
  };
}

describe('localStoragePlugin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores a metric under the default key', () => {
    const plugin = localStoragePlugin();
    plugin(makeMetric('LCP'));

    const stored = JSON.parse(localStorage.getItem('rum_metrics')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('LCP');
  });

  it('stores under a custom key', () => {
    const plugin = localStoragePlugin({ key: 'my_rum' });
    plugin(makeMetric('INP'));

    expect(localStorage.getItem('rum_metrics')).toBeNull();
    const stored = JSON.parse(localStorage.getItem('my_rum')!);
    expect(stored[0].name).toBe('INP');
  });

  it('appends to existing entries', () => {
    const plugin = localStoragePlugin();
    plugin(makeMetric('LCP'));
    plugin(makeMetric('CLS'));
    plugin(makeMetric('INP'));

    const stored = JSON.parse(localStorage.getItem('rum_metrics')!);
    expect(stored).toHaveLength(3);
    expect(stored.map((m: RUMMetric) => m.name)).toEqual(['LCP', 'CLS', 'INP']);
  });

  it('trims to maxEntries — keeps the most recent', () => {
    const plugin = localStoragePlugin({ maxEntries: 3 });
    for (let i = 1; i <= 5; i++) plugin(makeMetric('FCP', i * 100));

    const stored: RUMMetric[] = JSON.parse(
      localStorage.getItem('rum_metrics')!,
    );
    expect(stored).toHaveLength(3);
    expect(stored.map((m) => m.value)).toEqual([300, 400, 500]);
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const plugin = localStoragePlugin();
    expect(() => plugin(makeMetric('TTFB'))).not.toThrow();

    vi.restoreAllMocks();
  });

  it('does not throw on malformed existing data', () => {
    localStorage.setItem('rum_metrics', 'not-valid-json{{{');
    const plugin = localStoragePlugin();
    expect(() => plugin(makeMetric('LCP'))).not.toThrow();
  });
});
