import { beforeEach, describe, expect, it, vi } from 'vitest';
import { beaconPlugin } from './beacon';
import type { RUMMetric } from '../types';

function makeMetric(overrides?: Partial<RUMMetric>): RUMMetric {
  return {
    name: 'LCP',
    value: 2000,
    rating: 'good',
    delta: 2000,
    id: 'v3-lcp-1',
    navigationType: 'navigate',
    timestamp: 1000,
    ...overrides,
  };
}

describe('beaconPlugin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends metric via sendBeacon when available', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });

    const plugin = beaconPlugin({ endpoint: '/api/vitals' });
    plugin(makeMetric());

    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(sendBeacon).toHaveBeenCalledWith('/api/vitals', expect.any(Blob));
  });

  it('sends a Blob with application/json content type and correct payload', async () => {
    let capturedBlob: Blob | undefined;
    vi.stubGlobal('navigator', {
      sendBeacon: vi.fn((_, blob: Blob) => { capturedBlob = blob; return true; }),
    });

    const plugin = beaconPlugin({ endpoint: '/api/vitals' });
    plugin(makeMetric({ name: 'INP', value: 150 }));

    expect(capturedBlob!.type).toBe('application/json');

    // jsdom Blob does not expose .text() — use FileReader instead
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(capturedBlob!);
    });
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe('INP');
    expect(parsed.value).toBe(150);
  });

  it('falls back to fetch when sendBeacon is unavailable', () => {
    vi.stubGlobal('navigator', {});
    const fetchSpy = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('fetch', fetchSpy);

    const plugin = beaconPlugin({ endpoint: '/api/vitals' });
    plugin(makeMetric());

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith('/api/vitals', expect.objectContaining({
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('fetch fallback does not throw if the request fails', () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network error'))));

    const plugin = beaconPlugin({ endpoint: '/api/vitals' });
    expect(() => plugin(makeMetric())).not.toThrow();
  });
});
