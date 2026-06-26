import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useHouseholdId } from '@/hooks/useHousehold'
import { useUIStore } from '@/stores'
import {
  isPushSupported,
  isStandalone,
  getExistingSubscription,
  createSubscription,
} from '@/lib/push'

/**
 * Manages this device's web-push subscription: requests permission, subscribes
 * via the service worker, and mirrors the subscription into `push_subscriptions`
 * so the send-push edge function can reach it.
 */
export function usePush() {
  const { user } = useAuth()
  const householdId = useHouseholdId()
  const addToast = useUIStore((s) => s.addToast)

  const supported = isPushSupported()
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return
    getExistingSubscription()
      .then((s) => setSubscribed(!!s))
      .catch(() => {})
  }, [supported])

  const enable = useCallback(async () => {
    if (!supported || !user) return
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        addToast('Notification permission was not granted', 'error')
        return
      }
      const sub = await createSubscription()
      const json = sub.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          household_id: householdId,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' },
      )
      if (error) throw error
      setSubscribed(true)
      addToast('Push notifications enabled 🔔', 'success')
    } catch {
      addToast('Could not enable push notifications', 'error')
    } finally {
      setBusy(false)
    }
  }, [supported, user, householdId, addToast])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      const sub = await getExistingSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
      addToast('Push notifications turned off', 'info')
    } catch {
      addToast('Could not turn off push notifications', 'error')
    } finally {
      setBusy(false)
    }
  }, [addToast])

  return {
    supported,
    standalone: isStandalone(),
    permission,
    subscribed,
    busy,
    enable,
    disable,
  }
}
