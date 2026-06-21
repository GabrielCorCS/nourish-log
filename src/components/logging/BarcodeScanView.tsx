import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'

interface BarcodeScanViewProps {
  // Fired once a barcode is decoded.
  onDetected: (barcode: string) => void
}

/**
 * Inline camera viewfinder for the log flow (no Dialog wrapper, so it nests
 * cleanly inside the log sheet). Starts the camera on mount, stops on unmount.
 */
export function BarcodeScanView({ onDetected }: BarcodeScanViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    const reader = new BrowserMultiFormatReader()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (result && !cancelled) {
          onDetected(result.getText())
        }
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      })
      .catch((err) => {
        if (cancelled) return
        const name = (err as { name?: string })?.name
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Camera access was denied. Allow camera permission and try again.')
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setError('No camera was found on this device.')
        } else {
          setError('Could not start the camera. Please try again.')
        }
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [onDetected])

  if (error) {
    return (
      <div className="rounded-[22px] bg-gradient-to-br from-terracotta/[0.10] to-terracotta/[0.04] p-6 text-center ring-1 ring-terracotta/20">
        <p className="text-sm font-medium text-terracotta">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.35), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.3), transparent 70%)' }}
        />
        <video ref={videoRef} className="relative h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-3/4 rounded-[16px] border-2 border-lime/70 shadow-[0_0_20px_rgba(132,204,22,0.25)]" />
        </div>
      </div>
      <p className="text-center text-sm font-medium text-espresso/60">
        Point your camera at a product barcode
      </p>
    </div>
  )
}
