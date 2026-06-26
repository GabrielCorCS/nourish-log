import { useCallback, useEffect, useRef, useState } from 'react'

type TorchTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean }
}

/**
 * Controls the camera "torch" (flashlight) for a running <video> stream.
 *
 * Why this exists: a one-shot `applyConstraints({ torch: true })` right after
 * the camera starts is unreliable — on Android Chrome `getCapabilities()`
 * frequently reports no `torch` for a few hundred ms after the track goes live,
 * so the flash silently never turns on. So we poll until the capability appears
 * (or give up), auto-enable it, and expose a manual toggle as a fallback.
 *
 * iOS Safari / iOS PWAs do not expose the camera torch to web pages at all, so
 * `supported` stays false there and the toggle button is simply not rendered.
 */
export function useTorch(
  videoRef: React.RefObject<HTMLVideoElement>,
  active: boolean,
) {
  const [supported, setSupported] = useState(false)
  const [on, setOn] = useState(false)
  const onRef = useRef(false)
  onRef.current = on

  const getTrack = useCallback((): TorchTrack | null => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    return (stream?.getVideoTracks?.()[0] as TorchTrack) ?? null
  }, [videoRef])

  const apply = useCallback(
    async (value: boolean) => {
      const track = getTrack()
      if (!track) return
      try {
        await track.applyConstraints({
          advanced: [{ torch: value }],
        } as MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> })
        setOn(value)
      } catch {
        /* device refused — leave state as-is */
      }
    },
    [getTrack],
  )

  const toggle = useCallback(() => {
    void apply(!onRef.current)
  }, [apply])

  // Poll for torch capability once the camera is live, then auto-enable it.
  useEffect(() => {
    if (!active) {
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
      } else if (tries >= 16) {
        // ~4s with no torch capability → this device/browser can't do it.
        window.clearInterval(id)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [active, getTrack, apply])

  return { supported, on, toggle }
}
