// Daily end-of-day email report for NourishLog households.
//
// For every household it builds ONE combined email containing a section per
// member (ordered by name → "Gabriel's Report" then "Kaylin's Report"), with
// each person's macros vs. their goals (incl. per-weekday overrides), meals
// logged, and any weigh-in for the day. The same combined email is sent to
// every member so both people see both reports.
//
// Auth: custom `x-cron-key` header (verify_jwt is disabled) so pg_cron can call
// it. Email delivery uses Resend — set the RESEND_API_KEY secret to enable it;
// without it the function still runs and reports what it *would* have sent.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CRON_KEY = 'ndr-7b34e9a1c0f24d8e9b6a5c3f10e8d2b7'

// ── palette (matches the app) ───────────────────────────────────────────────
const C = {
  emerald: '#16A34A',
  emeraldDark: '#0F7A37',
  citrus: '#F97316',
  espresso: '#14331F',
  cream: '#F1FBF4',
  honey: '#F5B53F',
  blush: '#EC8C9C',
  sage: '#7BA98C',
  line: '#E2EFE6',
  ink: '#274133',
  muted: '#6B8576',
}

type Macro = { key: 'calories' | 'protein' | 'carbs' | 'fat'; label: string; unit: string; color: string }
const MACROS: Macro[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: C.emerald },
  { key: 'protein', label: 'Protein', unit: 'g', color: C.citrus },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: C.honey },
  { key: 'fat', label: 'Fat', unit: 'g', color: C.blush },
]

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🌅 Breakfast',
  lunch: '🥗 Lunch',
  dinner: '🍽️ Dinner',
  snack: '🍎 Snacks',
}

// ── timezone helpers ─────────────────────────────────────────────────────────
function tzOffsetMs(date: Date, tz: string): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }))
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  return local.getTime() - utc.getTime()
}

function ymdInTz(date: Date, tz: string): string {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// UTC instant of local midnight for a YYYY-MM-DD in `tz`.
function localMidnightUTC(ymd: string, tz: string): Date {
  const guess = new Date(`${ymd}T00:00:00Z`)
  const off = tzOffsetMs(guess, tz)
  return new Date(guess.getTime() - off)
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

// ── HTML building blocks ─────────────────────────────────────────────────────
function macroRow(label: string, unit: string, value: number, goal: number, color: string): string {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
  const over = goal > 0 && value > goal
  const barColor = over ? C.citrus : color
  return `
  <tr>
    <td style="padding:10px 0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font:600 13px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">${label}</td>
          <td align="right" style="font:600 13px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.muted};">
            <span style="color:${C.espresso};">${fmt(value)}</span> / ${fmt(goal)} ${unit}
            ${over ? `&nbsp;<span style="color:${C.citrus};font-weight:700;">+${fmt(value - goal)}</span>` : ''}
          </td>
        </tr>
      </table>
      <div style="margin-top:6px;height:9px;background:${C.line};border-radius:99px;overflow:hidden;">
        <div style="height:9px;width:${pct}%;background:${barColor};border-radius:99px;"></div>
      </div>
    </td>
  </tr>`
}

interface Section {
  name: string
  emoji: string
  totals: { calories: number; protein: number; carbs: number; fat: number }
  goals: { calories: number; protein: number; carbs: number; fat: number }
  meals: number
  mealBreakdown: Record<string, number>
  weightLabel: string | null
}

function memberSection(s: Section): string {
  const calPct = s.goals.calories > 0 ? Math.round((s.totals.calories / s.goals.calories) * 100) : 0
  const mealLine = Object.entries(s.mealBreakdown)
    .filter(([, n]) => n > 0)
    .map(([m, n]) => `${MEAL_LABELS[m] ?? m} ×${n}`)
    .join('&nbsp;&nbsp;•&nbsp;&nbsp;')

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${C.line};border-radius:18px;overflow:hidden;margin:0 0 18px;">
    <tr>
      <td style="background:linear-gradient(135deg,${C.emerald},${C.emeraldDark});padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font:700 18px/1.1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
              <span style="font-size:22px;">${s.emoji}</span>&nbsp; ${s.name}'s Report
            </td>
            <td align="right" style="font:600 13px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:rgba(255,255,255,0.9);">
              ${calPct}% of calories
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 22px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${MACROS.map((m) => macroRow(m.label, m.unit, s.totals[m.key], s.goals[m.key], m.color)).join('')}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 22px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr>
            <td style="background:${C.cream};border-radius:12px;padding:12px 14px;font:600 13px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">
              ${s.meals > 0 ? `🍴 <b>${s.meals}</b> ${s.meals === 1 ? 'meal' : 'meals'} logged` : '🌙 No meals logged today'}
              ${mealLine ? `<div style="margin-top:6px;color:${C.muted};font-weight:500;">${mealLine}</div>` : ''}
              ${s.weightLabel ? `<div style="margin-top:8px;color:${C.ink};">⚖️ Weigh-in: <b>${s.weightLabel}</b></div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function emailHtml(dateLabel: string, sections: Section[]): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr>
          <td style="text-align:center;padding:8px 0 22px;">
            <div style="font:800 26px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.espresso};letter-spacing:-0.5px;">🌿 NourishLog</div>
            <div style="margin-top:6px;font:600 14px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.muted};">Daily Report · ${dateLabel}</div>
          </td>
        </tr>
        <tr><td>${sections.map(memberSection).join('')}</td></tr>
        <tr>
          <td style="text-align:center;padding:10px 0 4px;font:500 12px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.muted};">
            Keep nourishing 💚<br/>You're getting this because daily reports are on for your household.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
  </body></html>`
}

// ── main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.headers.get('x-cron-key') !== CRON_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tz = Deno.env.get('REPORT_TZ') ?? 'America/Los_Angeles'
  const from = Deno.env.get('REPORT_FROM') ?? 'NourishLog <onboarding@resend.dev>'
  const resendKey = Deno.env.get('RESEND_API_KEY')

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

  // pull everything we need (small household, so simple fetches)
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

  // group households → members
  const households = new Map<string, string[]>()
  for (const hm of members.data ?? []) {
    const arr = households.get(hm.household_id) ?? []
    arr.push(hm.user_id)
    households.set(hm.household_id, arr)
  }

  const results: Array<{ household: string; to: string[]; status: string }> = []

  for (const [householdId, memberIds] of households) {
    // build a section per member, ordered by name (Gabriel before Kaylin)
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
        name: u.name ?? 'Member',
        emoji: u.avatar_emoji ?? '👤',
        totals,
        goals,
        meals: mine.length,
        mealBreakdown,
        weightLabel,
      }
    })

    // recipients: members with an email and notifications not explicitly off
    const recipients = ordered
      .filter((u) => u.email && settingsByUser.get(u.id)?.notifications_enabled !== false)
      .map((u) => u.email as string)

    if (recipients.length === 0) {
      results.push({ household: householdId, to: [], status: 'no recipients' })
      continue
    }

    const html = emailHtml(dateLabel, sections)
    const subject = `🌿 Your NourishLog daily report · ${dateLabel}`

    if (!resendKey) {
      results.push({ household: householdId, to: recipients, status: 'skipped: set RESEND_API_KEY' })
      continue
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: recipients, subject, html }),
    })
    const ok = resp.ok
    const detail = ok ? 'sent' : `error ${resp.status}: ${await resp.text()}`
    results.push({ household: householdId, to: recipients, status: detail })
  }

  return new Response(JSON.stringify({ date: ymd, tz, results }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
