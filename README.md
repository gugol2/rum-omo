# rum-omo

Real User Monitoring for the browser. Captures Core Web Vitals (LCP, INP, CLS, FCP, TTFB) from real users and ships them wherever you need — your own endpoint, localStorage, or the console.

## Packages

| Package                              | Description                                    |
| ------------------------------------ | ---------------------------------------------- |
| [`@rum-omo/core`](./packages/core)   | Framework-agnostic. Zero runtime dependencies. |
| [`@rum-omo/react`](./packages/react) | React adapter — provider + hook.               |

## Quick start

### Vanilla / framework-agnostic

```ts
import { createRUM } from "@rum-omo/core";

const rum = createRUM({
  endpoint: "/api/vitals", // POSTs each metric via sendBeacon
  debug: true, // pretty-prints to the console
});

rum.start();
```

### React

```tsx
import { RUMProvider, useRUM } from "@rum-omo/react";

// Wrap your app once
export default function App() {
  return (
    <RUMProvider config={{ endpoint: "/api/vitals", debug: true }}>
      <Router />
    </RUMProvider>
  );
}

// Read metrics anywhere in the tree
function PerfPanel() {
  const { metrics } = useRUM();
  return (
    <ul>
      {metrics.map((m) => (
        <li key={m.id}>
          {m.name}: {m.value} ({m.rating})
        </li>
      ))}
    </ul>
  );
}
```

## Installation

```bash
# core only
pnpm add @rum-omo/core

# with React adapter
pnpm add @rum-omo/core @rum-omo/react
```

## `createRUM(config)`

| Option     | Type          | Description                                                                       |
| ---------- | ------------- | --------------------------------------------------------------------------------- |
| `endpoint` | `string`      | URL to POST metrics to via `sendBeacon` (falls back to `fetch` with `keepalive`). |
| `debug`    | `boolean`     | Logs each metric to the console with colour-coded ratings.                        |
| `plugins`  | `RUMPlugin[]` | Custom plugin functions. See [Plugins](#plugins) below.                           |

Returns an `RUMInstance`:

```ts
rum.start(); // begin observing
rum.stop(); // stop observing (safe to call multiple times)
rum.getMetrics(); // returns a snapshot of all collected RUMMetric[]
```

## Metric shape

Every plugin receives a `RUMMetric`:

```ts
interface RUMMetric {
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number; // change since last report
  id: string; // stable per-page-load ID
  navigationType: string; // 'navigate' | 'reload' | 'back-forward' | ...
  timestamp: number; // Date.now() at collection time
}
```

## Plugins

A plugin is just a function: `(metric: RUMMetric) => void`. Everything is a plugin — including the built-ins.

### Built-in plugins

```ts
import { beaconPlugin, consolePlugin, localStoragePlugin } from "@rum-omo/core";

const rum = createRUM({
  plugins: [
    beaconPlugin({ endpoint: "/api/vitals" }),
    consolePlugin({ collapsed: true }),
    localStoragePlugin({ key: "rum_metrics", maxEntries: 50 }),
  ],
});
```

| Plugin               | Options                               | Description                                                 |
| -------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `beaconPlugin`       | `endpoint: string`                    | Sends each metric via `sendBeacon` (or `fetch` fallback).   |
| `consolePlugin`      | `collapsed?: boolean`                 | Colour-coded console group per metric.                      |
| `localStoragePlugin` | `key?: string`, `maxEntries?: number` | Persists metrics to `localStorage`, capped at `maxEntries`. |

### Custom plugins

```ts
const rum = createRUM({
  plugins: [
    (metric) => {
      if (metric.name === "LCP" && metric.rating === "poor") {
        notifySlack(`Poor LCP: ${metric.value}ms`);
      }
    },
  ],
});
```

## Core Web Vitals thresholds

| Metric | Good     | Needs improvement | Poor     |
| ------ | -------- | ----------------- | -------- |
| LCP    | ≤ 2500ms | ≤ 4000ms          | > 4000ms |
| INP    | ≤ 200ms  | ≤ 500ms           | > 500ms  |
| CLS    | ≤ 0.1    | ≤ 0.25            | > 0.25   |
| FCP    | ≤ 1800ms | ≤ 3000ms          | > 3000ms |
| TTFB   | ≤ 800ms  | ≤ 1800ms          | > 1800ms |

## Development

```bash
pnpm install
pnpm build       # build both packages
pnpm dev         # watch mode (It's a monorepo runs all packages: core and react) -> but only watches and rebuilds with tsup.
pnpm dev:demo        # watch mode of the demo app (react and plain vanilla) -> should run on Vite default port (5173)
pnpm typecheck   # type-check without emitting
```
