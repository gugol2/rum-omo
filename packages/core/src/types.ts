export type MetricName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export interface RUMMetric {
  name: MetricName;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

export type RUMPlugin = (metric: RUMMetric) => void;

export interface RUMConfig {
  endpoint?: string;
  debug?: boolean;
  plugins?: RUMPlugin[];
}

export interface RUMInstance {
  start: () => void;
  stop: () => void;
  getMetrics: () => RUMMetric[];
}

export interface BeaconPluginOptions {
  endpoint: string;
}

export interface ConsolePluginOptions {
  collapsed?: boolean;
}

export interface LocalStoragePluginOptions {
  key?: string;
  maxEntries?: number;
}
