import { useCallback, useEffect, useRef, useState } from 'react'

type TorchTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean }
  getSettings?: () => MediaTrackSettings & { torch?: boolean }
}

// iOS Safari / iOS PWAs do not expose the camera torch to web pages at all —
// there is no web API for it, so we never show a control there.
export function isTorchBlockedPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return iOS
}

/**
 * Controls the camera "torch" (flashlight) for a running <video> stream.
 *
 * Detection is deliberately lenient: `getCapabilities().torch` is the reliable
 * signal when present, but plenty of Android browsers don't report it (or report
 * it late) yet still accept the constraint. So we also confirm via
 * `getSettings().torch` after applying. The toggle returns whether the light is
 * actually on, so the UI can tell the user when a device refuses it.
 */
export function useTorch(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
) {
  const blocked = isTorchBlockedPlatform()
  const [supported, setSupported] = useState(false)
  const [on, setOn] = useState(false)
  const onRef = useRef(false)
  onRef.current = on

  const getTrack = useCallback((): TorchTrack | null => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    return (stream?.getVideoTracks?.()[0] as TorchTrack) ?? null
  }, [videoRef])

  // Returns true only if the torch actually ended up in the requested state.
  const apply = useCallback(
    async (value: boolean): Promise<boolean> => {
      const track = getTrack()
      if (!track) return false
      try {
        await track.applyConstraints({
          advanced: [{ torch: value }],
        } as MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> })
      } catch {
        return false
      }
      // `advanced` torch constraints never reject — they silently no-op on
      // devices that can't do it. So we must CONFIRM rather than assume:
      //  - prefer getSettings().torch (Chrome reports the real state)
      //  - else, for turning on, only trust it if the capability is advertised
      const settings = track.getSettings?.() as
        | (MediaTrackSettings & { torch?: boolean })
        | undefined
      const caps = track.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined
      let confirmed: boolean
      if (settings?.torch !== undefined) confirmed = settings.torch === value
      else if (!value) confirmed = true // turning off is always fine
      else confirmed = !!caps?.torch
      setOn(value && confirmed)
      return confirmed
    },
    [getTrack],
  )

  const toggle = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    const target = !onRef.current
    const track = getTrack()
    const caps = track?.getCapabilities?.() as
      | (MediaTrackCapabilities & { torch?: boolean })
      | undefined
    const hadCapability = !!caps?.torch
    const ok = await apply(target)
    if (ok && target) setSupported(true)
    if (target && !ok) {
      return {
        ok: false,
        message: hadCapability
          ? "The flashlight didn't respond — try tapping again."
          : "This phone's browser won't let a web app use the flashlight.",
      }
    }
    return { ok: true }
  }, [apply, getTrack])

  // Once the camera is live, detect torch capability and auto-enable it.
  useEffect(() => {
    if (!active || blocked) {
      setSupported(false)
      setOn(false)
      return
    }
    let cancelled = false
    let tries = 0
    const id = window.setInterval(() => {
      tries += 1
      const track = getTrack()
      const caps = track?.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined
      if (caps?.torch) {
        if (!cancelled) {
          setSupported(true)
          void apply(true)
        }
        window.clearInterval(id)
      } else if (tries >= 20) {
        // ~5s with no advertised torch capability — stop polling. The manual
        // button still lets the user try (some devices accept it anyway).
        window.clearInterval(id)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [active, blocked, getTrack, apply])

  return { supported, on, toggle, blocked }
}
