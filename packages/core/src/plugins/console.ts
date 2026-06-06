import type { ConsolePluginOptions, RUMPlugin } from '../types';

const RATING_COLOR: Record<string, string> = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
};

export function consolePlugin({ collapsed = false }: ConsolePluginOptions = {}): RUMPlugin {
  return (metric) => {
    const color = RATING_COLOR[metric.rating] ?? '#999';
    const open = collapsed ? console.groupCollapsed : console.group;
    open(`%c[RUM] ${metric.name} — ${metric.rating}`, `color:${color};font-weight:bold`);
    console.log('value :', metric.value);
    console.log('delta :', metric.delta);
    console.log('id    :', metric.id);
    console.log('nav   :', metric.navigationType);
    console.groupEnd();
  };
}
