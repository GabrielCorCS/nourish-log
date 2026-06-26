// Web Push (browser) helpers. The VAPID PUBLIC key is not secret — it's meant
// to be embedded in the client and must match the one in the send-push edge
// function. The matching PRIVATE key lives only as the VAPID_PRIVATE_KEY
// edge-function secret.
export const VAPID_PUBLIC_KEY =
  'BEQXn9cyrUREx-dlmsP0xnPktSo5yZsMIP37qX5v42UYFHOOAICaZvuXcr8UUseTUvOL-fLxc206IFg1t8LnmSw'

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * iOS only delivers web push to PWAs that have been added to the Home Screen
 * (installed / standalone). In a normal Safari tab it silently won't work, so
 * we surface a hint instead of a dead button.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia?.('(display-mode: standalone)')?.matches || iosStandalone === true
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function createSubscription(): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
}
