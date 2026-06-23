import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BARCODE_HINTS, createBarcodeConfirmer } from '@/lib/barcode'
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
    const reader = new BrowserMultiFormatReader(BARCODE_HINTS)
    const confirm = createBarcodeConfirmer()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        // Two consecutive identical reads guards against single-frame misreads.
        if (result && !cancelled && confirm(result.getText())) {
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
            <div className="rounded-[22px] bg-gradient-to-br from-terracotta/[0.10] to-terracotta/[0.04] p-6 text-center ring-1 ring-terracotta/20">
              <p className="text-sm font-medium text-terracotta">{error}</p>
            </div>
          ) : (
            <>
              {/* Camera viewfinder */}
              <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12]">
                {/* Ambient glow blobs */}
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
                <video
                  ref={videoRef}
                  className="relative h-full w-full object-cover"
                  muted
                  playsInline
                />
                {/* Viewfinder guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-3/5 w-3/4 rounded-[16px] border-2 border-lime/70 shadow-[0_0_20px_rgba(132,204,22,0.25)]" />
                </div>
              </div>
              <p className="text-center text-sm font-medium text-espresso/60">
                Point your camera at a product barcode — horizontal or vertical both work
              </p>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
