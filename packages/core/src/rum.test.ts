import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRUM } from './rum';
import type { RUMMetric } from './types';

type WebVitalsCb = (metric: any) => void;
const handlers: Record<string, WebVitalsCb> = {};

vi.mock('web-vitals', () => ({
  onLCP: vi.fn((cb: WebVitalsCb) => {
    handlers['LCP'] = cb;
  }),
  onINP: vi.fn((cb: WebVitalsCb) => {
    handlers['INP'] = cb;
  }),
  onCLS: vi.fn((cb: WebVitalsCb) => {
    handlers['CLS'] = cb;
  }),
  onFCP: vi.fn((cb: WebVitalsCb) => {
    handlers['FCP'] = cb;
  }),
  onTTFB: vi.fn((cb: WebVitalsCb) => {
    handlers['TTFB'] = cb;
  }),
}));

// Mock navigator.sendBeacon so beaconPlugin doesn't throw
Object.defineProperty(navigator, 'sendBeacon', {
  value: vi.fn(() => true),
  writable: true,
});

function makeRawMetric(name = 'LCP'): RUMMetric {
  return {
    name: name as RUMMetric['name'],
    value: 1000,
    rating: 'good',
    delta: 1000,
    id: `v3-${name}-1`,
    navigationType: 'navigate',
    timestamp: Date.now(),
  };
}

describe('createRUM', () => {
  beforeEach(() => {
    Object.keys(handlers).forEach((k) => delete handlers[k]);
    vi.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('start() begins collecting', () => {
      const rum = createRUM();
      rum.start();
      expect(Object.keys(handlers).length).toBeGreaterThan(0);
    });

    it('start() is idempotent — does not double-register', () => {
      const plugin = vi.fn();
      const rum = createRUM({ plugins: [plugin] });
      rum.start();
      rum.start(); // second call should be a no-op

      handlers['LCP']!(makeRawMetric('LCP'));

      expect(plugin).toHaveBeenCalledOnce();
    });

    it('stop() prevents further dispatching', () => {
      const plugin = vi.fn();
      const rum = createRUM({ plugins: [plugin] });
      rum.start();
      rum.stop();

      handlers['LCP']!(makeRawMetric('LCP'));

      expect(plugin).not.toHaveBeenCalled();
    });

    it('can be restarted after stop()', () => {
      const plugin = vi.fn();
      const rum = createRUM({ plugins: [plugin] });

      rum.start();
      rum.stop();
      rum.start();

      handlers['LCP']!(makeRawMetric('LCP'));

      expect(plugin).toHaveBeenCalledOnce();
    });
  });

  describe('getMetrics()', () => {
    it('returns empty array before any metrics arrive', () => {
      const rum = createRUM();
      rum.start();
      expect(rum.getMetrics()).toEqual([]);
    });

    it('accumulates metrics', () => {
      const rum = createRUM();
      rum.start();

      handlers['LCP']!(makeRawMetric('LCP'));
      handlers['CLS']!(makeRawMetric('CLS'));

      expect(rum.getMetrics()).toHaveLength(2);
      expect(rum.getMetrics()[0].name).toBe('LCP');
      expect(rum.getMetrics()[1].name).toBe('CLS');
    });

    it('returns a copy — mutations do not affect internal state', () => {
      const rum = createRUM();
      rum.start();
      handlers['FCP']!(makeRawMetric('FCP'));

      const snapshot = rum.getMetrics();
      snapshot.pop();

      expect(rum.getMetrics()).toHaveLength(1);
    });
  });

  describe('config', () => {
    it('wires up beaconPlugin when endpoint is provided', () => {
      const rum = createRUM({ endpoint: '/api/vitals' });
      rum.start();
      handlers['LCP']!(makeRawMetric('LCP'));
      expect(navigator.sendBeacon).toHaveBeenCalledWith(
        '/api/vitals',
        expect.any(Blob),
      );
    });

    it('calls custom plugins with the metric', () => {
      const custom = vi.fn();
      const rum = createRUM({ plugins: [custom] });
      rum.start();

      handlers['TTFB']!(makeRawMetric('TTFB'));

      expect(custom).toHaveBeenCalledOnce();
      expect(custom.mock.calls[0][0].name).toBe('TTFB');
    });

    it('calls multiple custom plugins in order', () => {
      const order: number[] = [];
      const rum = createRUM({
        plugins: [() => order.push(1), () => order.push(2)],
      });
      rum.start();
      handlers['INP']!(makeRawMetric('INP'));
      expect(order).toEqual([1, 2]);
    });
  });
});
