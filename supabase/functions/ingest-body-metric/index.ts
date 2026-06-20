/* eslint-disable */
// =============================================================================
// Supabase Edge Function: ingest-body-metric   (SCAFFOLD — NOT YET DEPLOYED)
//
// Source-agnostic ingestion endpoint for weight / body-composition readings.
// A future "Renpho sync" PR points a bridge at this endpoint; the bridge maps
// its export into the JSON contract below and POSTs it here. This function
// upserts into `public.body_metrics` using the service-role key (bypassing RLS),
// after verifying a shared secret.
//
// Why a bridge? Renpho has **no official public API**. Realistic options for the
// future PR (pick one, wire it, then call this endpoint):
//   1. Apple Health (iPhone): Renpho -> Apple Health; export via a Shortcuts
//      automation (Health -> webhook) or a small companion app reading HealthKit.
//   2. Google Fit / Health Connect (Android): Renpho -> Health Connect; a
//      companion app or Health Connect -> webhook relay.
//   3. Unofficial Renpho cloud API (reverse-engineered) — brittle, may break.
//
// Deploy (future): `supabase functions deploy ingest-body-metric`
// Secrets (future): RENPHO_WEBHOOK_SECRET (shared with the bridge); SUPABASE_URL
// and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
// =============================================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BodyMetricPayload {
  email: string // subject account (whose weigh-in this is)
  measured_at?: string
  weight_kg: number
  body_fat_pct?: number
  muscle_mass_kg?: number
  bmi?: number
  water_pct?: number
  bone_mass_kg?: number
  source?: 'renpho' | 'apple_health' | 'google_fit' | 'health_connect' | 'manual'
  raw?: unknown // original device/bridge payload, stored for debugging/audit
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  // TODO(renpho-sync): verify the request actually came from your bridge.
  const secret = req.headers.get('x-webhook-secret')
  const expected = Deno.env.get('RENPHO_WEBHOOK_SECRET')
  if (!expected || secret !== expected) {
    return json({ error: 'unauthorized' }, 401)
  }

  let payload: BodyMetricPayload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  if (!payload?.email || payload.weight_kg == null) {
    return json({ error: 'email and weight_kg are required' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Resolve the subject account by email.
  const { data: user, error: userErr } = await admin
    .from('app_users')
    .select('id')
    .ilike('email', payload.email)
    .maybeSingle()
  if (userErr) return json({ error: userErr.message }, 500)
  if (!user) return json({ error: 'no account for that email' }, 404)

  // TODO(renpho-sync): de-dupe on (user_id, measured_at, source) to make the
  // bridge safely retryable (e.g. upsert with a unique constraint).
  const { error } = await admin.from('body_metrics').insert({
    user_id: user.id,
    logged_by: user.id, // device-sourced -> attribute to the subject
    measured_at: payload.measured_at ?? new Date().toISOString(),
    weight_kg: payload.weight_kg,
    body_fat_pct: payload.body_fat_pct ?? null,
    muscle_mass_kg: payload.muscle_mass_kg ?? null,
    bmi: payload.bmi ?? null,
    water_pct: payload.water_pct ?? null,
    bone_mass_kg: payload.bone_mass_kg ?? null,
    source: payload.source ?? 'renpho',
    raw: payload.raw ?? payload,
  })
  if (error) return json({ error: error.message }, 500)

  return json({ ok: true })
})
