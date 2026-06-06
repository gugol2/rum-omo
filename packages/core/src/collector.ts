import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { RUMMetric, RUMPlugin } from './types';

export function startCollecting(plugins: RUMPlugin[]): () => void {
  let active = true;

  const dispatch = (metric: {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType?: string;
  }): void => {
    if (!active) return;
    const rumMetric: RUMMetric = {
      name: metric.name as RUMMetric['name'],
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType ?? 'navigate',
      timestamp: Date.now(),
    };
    plugins.forEach((p) => p(rumMetric));
  };

  onLCP(dispatch, { reportAllChanges: true });
  onINP(dispatch, { reportAllChanges: true });
  onCLS(dispatch, { reportAllChanges: true });
  onFCP(dispatch);
  onTTFB(dispatch);

  return () => {
    active = false;
  };
}
