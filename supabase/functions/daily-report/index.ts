// Daily end-of-day report for NourishLog households, delivered as an in-app
// notification (no email).
//
// For every household it computes a per-member summary (macros vs. that
// person's goals incl. per-weekday overrides, meals logged, weigh-in) and
// inserts one `day_report` notification per member whose body covers BOTH
// people — ordered by name ("Gabriel" then "Kaylin"). The app's realtime
// NotificationBell picks these up and toasts them. The full per-member
// breakdown is also stored in `data` for richer in-app rendering.
//
// Auth: custom `x-cron-key` header (verify_jwt disabled) so pg_cron can call it.
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Optional shared key gating who may invoke this function (it's verify_jwt=false).
// When the CRON_KEY secret is unset, the check is skipped. Set it (and have the
// pg_cron job send the same value) to lock the function down.
const CRON_KEY = Deno.env.get('CRON_KEY')

// ── timezone helpers ─────────────────────────────────────────────────────────
function tzOffsetMs(date: Date, tz: string): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  return local.getTime() - utc.getTime()
}

function ymdInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function localMidnightUTC(ymd: string, tz: string): Date {
  const guess = new Date(`${ymd}T00:00:00Z`)
  const off = tzOffsetMs(guess, tz)
  return new Date(guess.getTime() - off)
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

interface Section {
  user_id: string
  name: string
  emoji: string
  totals: { calories: number; protein: number; carbs: number; fat: number }
  goals: { calories: number; protein: number; carbs: number; fat: number }
  meals: number
  mealBreakdown: Record<string, number>
  weightLabel: string | null
}

// ── main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (CRON_KEY && req.headers.get('x-cron-key') !== CRON_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tz = Deno.env.get('REPORT_TZ') ?? 'America/Los_Angeles'

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date()
  const ymd = ymdInTz(now, tz)
  const start = localMidnightUTC(ymd, tz)
  const end = localMidnightUTC(ymdInTz(new Date(start.getTime() + 36 * 3600_000), tz), tz)
  const [y, m, d] = ymd.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Sun … 6=Sat
  const dateLabel = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  const startISO = start.toISOString()
  const endISO = end.toISOString()

  const [members, users, settings, overrides, entries, weights] = await Promise.all([
    sb.from('household_members').select('household_id,user_id'),
    sb.from('app_users').select('id,name,email,avatar_emoji'),
    sb.from('user_settings').select('user_id,daily_calorie_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal,notifications_enabled,weight_unit'),
    sb.from('weekday_goal_overrides').select('user_id,weekday,daily_calorie_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal').eq('weekday', weekday),
    sb.from('food_entries').select('user_id,calories,protein,carbs,fat,meal_type,logged_at').gte('logged_at', startISO).lt('logged_at', endISO),
    sb.from('body_metrics').select('user_id,weight_kg,measured_at').gte('measured_at', startISO).lt('measured_at', endISO).not('weight_kg', 'is', null).order('measured_at', { ascending: true }),
  ])

  const userById = new Map((users.data ?? []).map((u) => [u.id, u]))
  const settingsByUser = new Map((settings.data ?? []).map((s) => [s.user_id, s]))
  const overrideByUser = new Map((overrides.data ?? []).map((o) => [o.user_id, o]))

  const households = new Map<string, string[]>()
  for (const hm of members.data ?? []) {
    const arr = households.get(hm.household_id) ?? []
    arr.push(hm.user_id)
    households.set(hm.household_id, arr)
  }

  const results: Array<{ household: string; notified: string[]; status: string }> = []

  for (const [householdId, memberIds] of households) {
    const ordered = memberIds
      .map((id) => userById.get(id))
      .filter((u): u is NonNullable<typeof u> => !!u)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

    const sections: Section[] = ordered.map((u) => {
      const base = settingsByUser.get(u.id)
      const ov = overrideByUser.get(u.id)
      const goals = {
        calories: ov?.daily_calorie_goal ?? base?.daily_calorie_goal ?? 2000,
        protein: ov?.daily_protein_goal ?? base?.daily_protein_goal ?? 150,
        carbs: ov?.daily_carbs_goal ?? base?.daily_carbs_goal ?? 250,
        fat: ov?.daily_fat_goal ?? base?.daily_fat_goal ?? 65,
      }
      const mine = (entries.data ?? []).filter((e) => e.user_id === u.id)
      const totals = mine.reduce(
        (acc, e) => ({
          calories: acc.calories + Number(e.calories || 0),
          protein: acc.protein + Number(e.protein || 0),
          carbs: acc.carbs + Number(e.carbs || 0),
          fat: acc.fat + Number(e.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      )
      const mealBreakdown: Record<string, number> = {}
      for (const e of mine) mealBreakdown[e.meal_type] = (mealBreakdown[e.meal_type] ?? 0) + 1

      const myWeights = (weights.data ?? []).filter((w) => w.user_id === u.id)
      const last = myWeights[myWeights.length - 1]
      let weightLabel: string | null = null
      if (last?.weight_kg != null) {
        const unit = base?.weight_unit ?? 'lb'
        const val = unit === 'kg' ? Number(last.weight_kg) : Number(last.weight_kg) * 2.20462
        weightLabel = `${val.toFixed(1)} ${unit}`
      }

      return {
        user_id: u.id,
        name: u.name ?? 'Member',
        emoji: u.avatar_emoji ?? '👤',
        totals,
        goals,
        meals: mine.length,
        mealBreakdown,
        weightLabel,
      }
    })

    // Body: one line per person, covering both. Shown in the notification bell.
    const summaryLine = (s: Section) => {
      const cal = `${fmt(s.totals.calories)}/${fmt(s.goals.calories)} kcal`
      const pro = `${fmt(s.totals.protein)}/${fmt(s.goals.protein)}g protein`
      const meals = s.meals > 0 ? `${s.meals} ${s.meals === 1 ? 'meal' : 'meals'}` : 'no meals'
      const w = s.weightLabel ? ` · ⚖️ ${s.weightLabel}` : ''
      return `${s.emoji} ${s.name}: ${cal} · ${pro} · ${meals}${w}`
    }
    const body = sections.map(summaryLine).join('\n')
    const title = `📊 Your daily report is ready · ${dateLabel}`

    // recipients: members with notifications not explicitly off
    const recipients = ordered.filter(
      (u) => settingsByUser.get(u.id)?.notifications_enabled !== false,
    )

    // Skip anyone who already has today's report (so re-runs don't duplicate).
    const existing = await sb
      .from('notifications')
      .select('recipient_user_id')
      .eq('household_id', householdId)
      .eq('type', 'day_report')
      .eq('data->>date', ymd)
    const already = new Set((existing.data ?? []).map((r) => r.recipient_user_id))

    const toInsert = recipients
      .filter((u) => !already.has(u.id))
      .map((u) => ({
        household_id: householdId,
        recipient_user_id: u.id,
        actor_user_id: null,
        type: 'day_report',
        title,
        body,
        data: { date: ymd, tz, sections },
      }))

    if (toInsert.length === 0) {
      results.push({ household: householdId, notified: [], status: 'already sent today' })
      continue
    }

    const { error } = await sb.from('notifications').insert(toInsert)
    results.push({
      household: householdId,
      notified: toInsert.map((n) => n.recipient_user_id),
      status: error ? `error: ${error.message}` : 'notified',
    })
  }

  return new Response(JSON.stringify({ date: ymd, tz, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
