# Renpho / smart-scale integration — scaffold

This branch lays the groundwork for syncing weigh-ins from a Renpho smart scale
into NourishLog. The **sync itself is a future PR**; what's here is the durable
plumbing so that PR is small.

## What's in place now

- **`body_metrics` table** (`supabase/migrations/20260620050000_renpho_body_metrics.sql`)
  — weight + body-composition columns, a `source` enum
  (`manual | renpho | apple_health | google_fit | health_connect`), a `raw` jsonb
  for the original payload, and `logged_by` for proxy entries.
  RLS mirrors `food_entries`: personal subject (`user_id`), visible **and**
  writable to household co-members — so Kaylin can see/log Gabriel's weigh-ins.
- **Manual logging UI** — `src/components/progress/WeightTracker.tsx` on the
  Progress page: log weight (+ optional body-fat %), a trend chart, a You/partner
  toggle, and lb/kg display (Settings → Units). Hook: `src/hooks/useBodyMetrics.ts`.
- **Ingestion endpoint stub** — `supabase/functions/ingest-body-metric/` accepts a
  source-agnostic JSON payload, verifies a shared secret, resolves the subject by
  email, and inserts a row (service role). Marked with `TODO(renpho-sync)`.

## Why a bridge is required

Renpho has **no official public API**. The realistic paths (the future PR picks one):

1. **Apple Health (iPhone).** Renpho already syncs to Apple Health. Bridge it out
   with a Shortcuts automation ("when a body measurement is added → POST to the
   endpoint") or a small companion app reading HealthKit.
2. **Google Fit / Health Connect (Android).** Renpho → Health Connect; a companion
   app or relay forwards readings to the endpoint.
3. **Unofficial Renpho cloud API** (reverse-engineered). Quickest to wire but
   brittle and may break without notice.

## The contract (what the future bridge POSTs)

```
POST /functions/v1/ingest-body-metric
Headers: x-webhook-secret: <RENPHO_WEBHOOK_SECRET>
Body: {
  "email": "gabrielcordova.wk@gmail.com",   // subject account
  "measured_at": "2026-06-20T13:00:00Z",
  "weight_kg": 78.4,
  "body_fat_pct": 18.2,                       // optional
  "muscle_mass_kg": 60.1,                     // optional
  "source": "renpho"                          // optional, defaults to "renpho"
}
```

## Future-PR checklist

- [ ] Choose + build the bridge (Apple Health / Health Connect / unofficial API).
- [ ] `supabase secrets set RENPHO_WEBHOOK_SECRET=...`; `supabase functions deploy ingest-body-metric`.
- [ ] Add a unique constraint + upsert in the function so retries are idempotent.
- [ ] Surface body-fat / muscle trends in `WeightTracker` (data already captured).
