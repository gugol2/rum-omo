import type { RUMPlugin } from '../types';

interface BeaconPluginOptions {
  endpoint: string;
}

export function beaconPlugin({ endpoint }: BeaconPluginOptions): RUMPlugin {
  return (metric) => {
    const body = JSON.stringify(metric);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      // sendBeacon unavailable — fall back to fetch with keepalive so it survives page unload
      fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  };
}
