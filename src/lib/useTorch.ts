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

  // Returns true if the torch ended up in the requested state.
  const apply = useCallback(
    async (value: boolean): Promise<boolean> => {
      const track = getTrack()
      if (!track) return false
      try {
        await track.applyConstraints({
          advanced: [{ torch: value }],
        } as MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> })
        // `advanced` constraints never reject, so confirm via settings when the
        // browser reports it; if it doesn't report torch at all, assume success.
        const settings = track.getSettings?.() as
          | (MediaTrackSettings & { torch?: boolean })
          | undefined
        const actual = settings?.torch
        const ok = actual === undefined ? true : actual === value
        setOn(value && ok)
        return value ? ok : true
      } catch {
        return false
      }
    },
    [getTrack],
  )

  const toggle = useCallback(async (): Promise<boolean> => {
    const target = !onRef.current
    const ok = await apply(target)
    if (ok && target) setSupported(true)
    return target ? ok : true
  }, [apply])

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
