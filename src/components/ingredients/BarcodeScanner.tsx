import { useEffect, useRef, useState } from 'react'
import { Flashlight, FlashlightOff } from 'lucide-react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BARCODE_HINTS, createBarcodeConfirmer } from '@/lib/barcode'
import { useTorch } from '@/lib/useTorch'
import { useUIStore } from '@/stores'
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
  const [streaming, setStreaming] = useState(false)
  const torch = useTorch(videoRef, streaming)
  const addToast = useUIStore((s) => s.addToast)

  const handleTorch = async () => {
    const { ok, message } = await torch.toggle()
    if (!ok && message) addToast(message, 'error')
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setError(null)
    setStreaming(false)
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
        setStreaming(true)
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
                {/* Flashlight toggle — shown while the camera is live (hidden on
                    iOS, which can't control the torch from the web at all). */}
                {streaming && !torch.blocked && (
                  <button
                    type="button"
                    onClick={handleTorch}
                    aria-label={torch.on ? 'Turn flashlight off' : 'Turn flashlight on'}
                    aria-pressed={torch.on}
                    className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full backdrop-blur-sm transition-colors ${
                      torch.on
                        ? 'bg-amber-300 text-espresso shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                        : 'bg-black/55 text-white hover:bg-black/70'
                    }`}
                  >
                    {torch.on ? (
                      <Flashlight className="h-5 w-5" />
                    ) : (
                      <FlashlightOff className="h-5 w-5" />
                    )}
                  </button>
                )}
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
