import type { LocalStoragePluginOptions, RUMMetric, RUMPlugin } from '../types';

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
      console.warn(
        'localStoragePlugin: unable to store metric in localStorage',
      );
    }
  };
}
