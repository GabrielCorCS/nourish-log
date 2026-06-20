import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onDetected: (barcode: string) => void
}

export function BarcodeScanner({
  open,
  onClose,
  onDetected,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setError(null)
    const reader = new BrowserMultiFormatReader()

    // Passing undefined for deviceId lets the reader prefer the rear
    // (environment-facing) camera when available — ideal on mobile.
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
          setError(
            'Camera access was denied. Please allow camera permission and try again.'
          )
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
  }, [open, onDetected])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {error ? (
            <p className="text-sm text-terracotta text-center py-8">{error}</p>
          ) : (
            <>
              <div className="relative aspect-square w-full overflow-hidden rounded-card bg-espresso/90">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                {/* Centered viewfinder guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-3/4 rounded-input border-2 border-warm-white/80" />
                </div>
              </div>
              <p className="text-center text-sm text-espresso/60">
                Point your camera at a product barcode
              </p>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
