import { startCollecting } from './collector';
import { beaconPlugin } from './plugins/beacon';
import { consolePlugin } from './plugins/console';
import type { RUMConfig, RUMInstance, RUMMetric, RUMPlugin } from './types';

export function createRUM(config: RUMConfig = {}): RUMInstance {
  const metrics: RUMMetric[] = [];
  let stopFn: (() => void) | null = null;

  const builtins: RUMPlugin[] = [];
  if (config.endpoint) builtins.push(beaconPlugin({ endpoint: config.endpoint }));
  if (config.debug) builtins.push(consolePlugin());

  const internalCollect: RUMPlugin = (metric) => {
    metrics.push(metric);
  };

  const allPlugins = [internalCollect, ...builtins, ...(config.plugins ?? [])];

  return {
    start() {
      if (stopFn) return;
      stopFn = startCollecting(allPlugins);
    },
    stop() {
      stopFn?.();
      stopFn = null;
    },
    getMetrics() {
      return [...metrics];
    },
  };
}
