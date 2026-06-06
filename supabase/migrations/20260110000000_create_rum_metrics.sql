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

create index rum_metrics_name_idx       on rum_metrics (name);
create index rum_metrics_created_at_idx on rum_metrics (created_at desc);
create index rum_metrics_rating_idx     on rum_metrics (name, rating);
