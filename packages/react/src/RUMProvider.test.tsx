import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRUM as createRUMActual } from '@rum-omo/core';
import type { RUMConfig, RUMMetric, RUMPlugin } from '@rum-omo/core';
import { RUMProvider, useRUM } from './RUMProvider';

const mockStart = vi.fn();
const mockStop = vi.fn();
let capturedPlugins: RUMPlugin[] = [];

vi.mock('@rum-omo/core', () => ({
  createRUM: vi.fn((config: RUMConfig) => {
    capturedPlugins = config.plugins ?? [];
    return { start: mockStart, stop: mockStop, getMetrics: vi.fn(() => []) };
  }),
}));

function makeMetric(name = 'LCP'): RUMMetric {
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

function Consumer() {
  const { metrics } = useRUM();
  return (
    <ul>
      {metrics.map((m) => (
        <li key={m.id} data-testid="metric">{m.name}</li>
      ))}
    </ul>
  );
}

describe('RUMProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPlugins = [];
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('calls start() on mount', () => {
    render(<RUMProvider config={{}}><span /></RUMProvider>);
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it('calls stop() on unmount', () => {
    const { unmount } = render(<RUMProvider config={{}}><span /></RUMProvider>);
    unmount();
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it('does not call start() more than once on re-render', () => {
    const { rerender } = render(
      <RUMProvider config={{}}>
        <span />
      </RUMProvider>,
    );
    rerender(<RUMProvider config={{ debug: true }}><span /></RUMProvider>);
    expect(mockStart).toHaveBeenCalledOnce();
  });

  it('passes config options to createRUM', () => {
    const createRUM = vi.mocked(createRUMActual);
    render(<RUMProvider config={{ endpoint: '/api/vitals', debug: true }}><span /></RUMProvider>);
    expect(createRUM).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: '/api/vitals', debug: true }),
    );
  });

  it('useRUM starts with empty metrics', () => {
    render(
      <RUMProvider config={{}}>
        <Consumer />
      </RUMProvider>,
    );
    expect(screen.queryAllByTestId('metric')).toHaveLength(0);
  });

  it('useRUM reflects metrics as they arrive', () => {
    render(
      <RUMProvider config={{}}>
        <Consumer />
      </RUMProvider>,
    );

    act(() => {
      capturedPlugins.forEach((p) => p(makeMetric('LCP')));
    });

    expect(screen.getAllByTestId('metric')).toHaveLength(1);
    expect(screen.getByTestId('metric').textContent).toBe('LCP');
  });

  it('accumulates multiple metrics', () => {
    render(
      <RUMProvider config={{}}>
        <Consumer />
      </RUMProvider>,
    );

    act(() => { capturedPlugins.forEach((p) => p(makeMetric('LCP'))); });
    act(() => { capturedPlugins.forEach((p) => p(makeMetric('CLS'))); });
    act(() => { capturedPlugins.forEach((p) => p(makeMetric('INP'))); });

    const items = screen.getAllByTestId('metric');
    expect(items).toHaveLength(3);
    expect(items.map((el) => el.textContent)).toEqual(['LCP', 'CLS', 'INP']);
  });
});
