# rum-omo

Real User Monitoring for the browser. Captures Core Web Vitals (LCP, INP, CLS, FCP, TTFB) from real users and ships them wherever you need — your own endpoint, localStorage, or the console.

## Live demo

You can see a live demo vanilla: (zero runtime dependencies, framework-agnostic) and React: (Provider + hook adapter) **[here!](https://rum-omo-demo.vercel.app/)**

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

## Backend: Supabase

A ready-to-deploy Supabase Edge Function is included in `supabase/` for storing metrics in Postgres.

### Setup

**1. Create the table** — run this in the Supabase SQL Editor:

```sql
-- supabase/migrations/20260606000000_create_rum_metrics.sql
create table if not exists rum_metrics (
  id              bigserial primary key,
  metric_id       text not null,
  name            text not null check (name in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
  value           double precision not null,
  rating          text not null check (rating in ('good', 'needs-improvement', 'poor')),
  delta           double precision not null,
  navigation_type text,
  timestamp       bigint not null,
  created_at      timestamptz not null default now()
);

alter table rum_metrics enable row level security;
```

**2. Deploy the Edge Function:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy vitals --no-verify-jwt
```

The `--no-verify-jwt` flag is required — the endpoint is public by design (browsers POST to it without authentication).

**3. Point `beaconPlugin` at your function:**

```ts
const rum = createRUM({
  endpoint: "https://<your-project-ref>.supabase.co/functions/v1/vitals",
});
rum.start();
```

Use an environment variable to keep the URL out of source control:

```bash
# .env (add to .gitignore)
VITE_VITALS_ENDPOINT=https://<your-project-ref>.supabase.co/functions/v1/vitals
```

```ts
const rum = createRUM({ endpoint: import.meta.env.VITE_VITALS_ENDPOINT });
```

### Querying

Once data is flowing, query it from the Supabase SQL Editor or connect Grafana via the Postgres connection string (project Settings → Database):

```sql
-- ratings breakdown per metric
select name, rating, count(*), round(avg(value)::numeric, 0) as avg_ms
from rum_metrics
group by name, rating
order by name, rating;

-- p75 LCP over the last 7 days
select percentile_cont(0.75) within group (order by value) as p75_lcp
from rum_metrics
where name = 'LCP'
  and created_at > now() - interval '7 days';
```

## Core Web Vitals

### What each metric measures

**LCP — Largest Contentful Paint**
Marks when the largest visible element (hero image, heading, or block of text) finishes rendering. Represents perceived load speed from the user's point of view.

**INP — Interaction to Next Paint**
Measures the worst-case delay from any user interaction (click, tap, key press) to the next visual update. Replaced FID as the official responsiveness metric in March 2024.

**CLS — Cumulative Layout Shift**
Scores unexpected layout shifts during the page's lifetime. Each shift is weighted by the fraction of the viewport that moved. A CLS of 0 means nothing jumped around.

**FCP — First Contentful Paint**
Records when the browser renders the first bit of content from the DOM — text, image, SVG, or non-white canvas. Earlier than LCP; tells you how quickly something appears at all.

**TTFB — Time to First Byte**
Time between the browser sending the request and receiving the first byte of the response. Reflects server response time and network latency. Not a Core Web Vital but strongly influences all other metrics.

### Thresholds

| Metric | Good     | Needs improvement | Poor     |
| ------ | -------- | ----------------- | -------- |
| LCP    | ≤ 2500ms | ≤ 4000ms          | > 4000ms |
| INP    | ≤ 200ms  | ≤ 500ms           | > 500ms  |
| CLS    | ≤ 0.1    | ≤ 0.25            | > 0.25   |
| FCP    | ≤ 1800ms | ≤ 3000ms          | > 3000ms |
| TTFB   | ≤ 800ms  | ≤ 1800ms          | > 1800ms |

Google uses the **75th percentile** across all page loads (split by mobile and desktop) to determine pass/fail for Search ranking signals.

## Development

```bash
pnpm install
pnpm build       # build both packages
pnpm dev         # watch mode (It's a monorepo runs all packages: core and react) -> but only watches and rebuilds with tsup.
pnpm dev:demo        # watch mode of the demo app (react and plain vanilla) -> should run on Vite default port (5173)
pnpm typecheck   # type-check without emitting
```
