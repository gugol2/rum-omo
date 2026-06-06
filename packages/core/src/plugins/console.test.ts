import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RUMMetric } from '../types';
import { consolePlugin } from './console';

function makeMetric(overrides?: Partial<RUMMetric>): RUMMetric {
  return {
    name: 'LCP',
    value: 2500,
    rating: 'good',
    delta: 2500,
    id: 'v3-lcp-1',
    navigationType: 'navigate',
    timestamp: 1000,
    ...overrides,
  };
}

describe('consolePlugin', () => {
  beforeEach(() => {
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a console group with the metric name and rating', () => {
    const plugin = consolePlugin();
    plugin(makeMetric({ name: 'LCP', rating: 'good' }));
    expect(console.group).toHaveBeenCalledWith(
      expect.stringContaining('LCP'),
      expect.any(String),
    );
  });

  it('uses groupCollapsed when collapsed: true', () => {
    const plugin = consolePlugin({ collapsed: true });
    plugin(makeMetric());
    expect(console.groupCollapsed).toHaveBeenCalledOnce();
    expect(console.group).not.toHaveBeenCalled();
  });

  it('closes the group', () => {
    const plugin = consolePlugin();
    plugin(makeMetric());
    expect(console.groupEnd).toHaveBeenCalledOnce();
  });

  it('logs value, delta, id, and navigationType', () => {
    const plugin = consolePlugin();
    plugin(
      makeMetric({
        value: 1234,
        delta: 100,
        id: 'v3-x',
        navigationType: 'reload',
      }),
    );

    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[1],
    );
    expect(logCalls).toContain(1234);
    expect(logCalls).toContain(100);
    expect(logCalls).toContain('v3-x');
    expect(logCalls).toContain('reload');
  });

  it('uses the correct colour for each rating', () => {
    const greenPlugin = consolePlugin();
    greenPlugin(makeMetric({ rating: 'good' }));
    const goodStyle: string = (console.group as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(goodStyle).toContain('#0cce6b');

    vi.clearAllMocks();

    const orangePlugin = consolePlugin();
    orangePlugin(makeMetric({ rating: 'needs-improvement' }));
    const needsStyle: string = (console.group as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(needsStyle).toContain('#ffa400');

    vi.clearAllMocks();

    const redPlugin = consolePlugin();
    redPlugin(makeMetric({ rating: 'poor' }));
    const poorStyle: string = (console.group as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(poorStyle).toContain('#ff4e42');
  });
});
