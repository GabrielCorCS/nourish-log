// Sends a Web Push message to every device a user has subscribed.
//
// Fired by the `trg_push_on_notification` trigger on each new `notifications`
// row (via pg_net), so weigh-ins, proxy logs, calendar assignments and the
// daily report all push to the recipient's phone — even with the app closed
// (PWA installed to the home screen).
//
// Auth: custom `x-cron-key` header (verify_jwt disabled). The VAPID PUBLIC key
// and subject are not secret and are hardcoded here to match the client; the
// PRIVATE key is read from the VAPID_PRIVATE_KEY edge-function secret.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Optional shared key gating who may invoke this function (it's verify_jwt=false).
// When the CRON_KEY secret is unset, the check is skipped. Set it (and have the
// DB trigger send the same value) to lock the function down.
const CRON_KEY = Deno.env.get('CRON_KEY')

// Must match VAPID_PUBLIC_KEY embedded in the client (src/lib/push.ts).
const VAPID_PUBLIC_KEY =
  'BEQXn9cyrUREx-dlmsP0xnPktSo5yZsMIP37qX5v42UYFHOOAICaZvuXcr8UUseTUvOL-fLxc206IFg1t8LnmSw'
const VAPID_SUBJECT = 'mailto:gabrielcordova.wk@gmail.com'

const TYPE_ICON: Record<string, string> = {
  weigh_in: '⚖️',
  proxy_log: '🍽️',
  calendar_task: '📅',
  day_report: '📊',
}

Deno.serve(async (req) => {
  if (CRON_KEY && req.headers.get('x-cron-key') !== CRON_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privateKey) {
    return new Response(
      JSON.stringify({ status: 'skipped: set VAPID_PRIVATE_KEY secret' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey)

  const { recipient_user_id, title, body, type, url } = await req.json()
  if (!recipient_user_id) {
    return new Response(JSON.stringify({ error: 'recipient_user_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', recipient_user_id)

  const payload = JSON.stringify({
    title: title || 'NourishLog',
    body: body || '',
    type: type || 'nourishlog',
    icon: TYPE_ICON[type] ?? '🌿',
    url: url || '/',
  })

  let sent = 0
  let removed = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      )
      sent += 1
    } catch (err) {
      // 404/410 → the subscription is gone; prune it so we stop retrying.
      const code = (err as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) {
        await sb.from('push_subscriptions').delete().eq('id', s.id)
        removed += 1
      }
    }
  }

  return new Response(JSON.stringify({ recipient_user_id, sent, removed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
