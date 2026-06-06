import type { RUMMetric, RUMPlugin } from '../types';

interface LocalStoragePluginOptions {
  key?: string;
  maxEntries?: number;
}

export function localStoragePlugin({
  key = 'rum_metrics',
  maxEntries = 100,
}: LocalStoragePluginOptions = {}): RUMPlugin {
  return (metric) => {
    try {
      const raw = localStorage.getItem(key);
      const entries: RUMMetric[] = raw ? (JSON.parse(raw) as RUMMetric[]) : [];
      entries.push(metric);
      localStorage.setItem(key, JSON.stringify(entries.slice(-maxEntries)));
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
    }
  };
}
